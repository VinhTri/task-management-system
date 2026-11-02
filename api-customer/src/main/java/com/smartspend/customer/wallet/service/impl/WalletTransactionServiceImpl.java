package com.smartspend.customer.wallet.service.impl;

import com.smartspend.common.exception.AppException;
import com.smartspend.customer.account.service.CustomerAccountService;
import com.smartspend.customer.wallet.dto.request.WalletOperationRequest;
import com.smartspend.customer.wallet.dto.response.WalletTransactionResponse;
import com.smartspend.customer.wallet.dto.request.InternalTransferRequest;
import com.smartspend.customer.wallet.dto.response.InternalTransferResponse;
import com.smartspend.customer.wallet.exception.WalletErrorCode;
import com.smartspend.customer.wallet.service.WalletTransactionService;
import com.smartspend.transaction.entity.WalletTransaction;
import com.smartspend.transaction.entity.WalletTransfer;
import com.smartspend.transaction.enums.TransactionType;
import com.smartspend.transaction.repository.WalletTransactionRepository;
import com.smartspend.transaction.repository.WalletTransferRepository;
import com.smartspend.transaction.reference.TransactionReferenceGenerator;
import com.smartspend.wallet.entity.Wallet;
import com.smartspend.wallet.exception.InsufficientBalanceException;
import com.smartspend.wallet.exception.InvalidWalletAmountException;
import com.smartspend.wallet.exception.WalletBalanceLimitExceededException;
import com.smartspend.wallet.repository.WalletRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class WalletTransactionServiceImpl implements WalletTransactionService {
    private static final int IDEMPOTENCY_KEY_MAX_LENGTH = 100;
    private static final int DESCRIPTION_MAX_LENGTH = 255;
    private static final BigDecimal MIN_TRANSACTION_AMOUNT = new BigDecimal("2000");
    private static final BigDecimal MAX_TRANSACTION_AMOUNT = new BigDecimal("1000000000");
    private final WalletRepository wallets;
    private final WalletTransactionRepository transactions;
    private final WalletTransferRepository transfers;
    private final CustomerAccountService accountService;
    private final TransactionReferenceGenerator referenceGenerator;

    public WalletTransactionServiceImpl(
            WalletRepository wallets,
            WalletTransactionRepository transactions,
            WalletTransferRepository transfers,
            CustomerAccountService accountService,
            TransactionReferenceGenerator referenceGenerator) {
        this.wallets = wallets;
        this.transactions = transactions;
        this.transfers = transfers;
        this.accountService = accountService;
        this.referenceGenerator = referenceGenerator;
    }

    @Override
    @Transactional
    public WalletTransactionResponse deposit(
            Long userId, String idempotencyKey, WalletOperationRequest request) {
        return execute(userId, idempotencyKey, request, TransactionType.DEPOSIT);
    }

    @Override
    @Transactional
    public WalletTransactionResponse withdraw(
            Long userId, String idempotencyKey, WalletOperationRequest request) {
        return execute(userId, idempotencyKey, request, TransactionType.WITHDRAWAL);
    }

    @Override
    @Transactional
    public InternalTransferResponse transfer(
            Long userId, String idempotencyKey, InternalTransferRequest request) {
        validateTransactionAmount(request.amount());
        validateDescription(request.description());
        validateIdempotencyKey(idempotencyKey);
        accountService.verifyTransactionPin(userId, request.pin());

        Wallet senderSnapshot = wallets.findDefaultByUserId(userId)
                .orElseThrow(() -> new AppException(WalletErrorCode.WALLET_NOT_FOUND));
        Wallet recipientSnapshot = wallets.findDefaultByAccountNumber(request.recipientAccountNumber())
                .orElseThrow(() -> new AppException(WalletErrorCode.RECIPIENT_ACCOUNT_NOT_FOUND));

        if (senderSnapshot.getId().equals(recipientSnapshot.getId())) {
            throw new AppException(WalletErrorCode.SELF_TRANSFER_NOT_ALLOWED);
        }

        List<Long> walletIds = List.of(senderSnapshot.getId(), recipientSnapshot.getId())
                .stream()
                .sorted()
                .toList();
        Map<Long, Wallet> lockedWallets = wallets.findAllByIdForUpdate(walletIds).stream()
                .collect(Collectors.toMap(Wallet::getId, Function.identity()));
        if (lockedWallets.size() != 2) {
            throw new AppException(WalletErrorCode.TRANSFER_WALLETS_NOT_FOUND);
        }

        Wallet sender = lockedWallets.get(senderSnapshot.getId());
        Wallet recipient = lockedWallets.get(recipientSnapshot.getId());

        var existing = transfers.findBySenderWalletIdAndIdempotencyKey(sender.getId(), idempotencyKey);
        if (existing.isPresent()) {
            WalletTransfer previous = existing.get();
            boolean sameRecipient = previous.getRecipientWallet().getId().equals(recipient.getId());
            boolean sameAmount = previous.getAmount().compareTo(request.amount()) == 0;
            if (!sameRecipient || !sameAmount) {
                throw new AppException(WalletErrorCode.IDEMPOTENCY_CONFLICT);
            }
            return InternalTransferResponse.from(previous);
        }

        BigDecimal senderBefore = sender.getBalance();
        BigDecimal recipientBefore = recipient.getBalance();
        try {
            sender.withdraw(request.amount());
            recipient.deposit(request.amount());
        } catch (InvalidWalletAmountException exception) {
            throw new AppException(WalletErrorCode.INVALID_AMOUNT);
        } catch (InsufficientBalanceException exception) {
            throw new AppException(WalletErrorCode.INSUFFICIENT_BALANCE);
        } catch (WalletBalanceLimitExceededException exception) {
            throw new AppException(WalletErrorCode.WALLET_BALANCE_LIMIT_EXCEEDED);
        }

        String description = normalizeDescription(request.description());
        String transferReference = referenceGenerator.generateTransferReference();
        WalletTransfer transfer = transfers.save(WalletTransfer.success(
                transferReference,
                sender,
                recipient,
                idempotencyKey,
                request.amount(),
                senderBefore,
                sender.getBalance(),
                recipientBefore,
                recipient.getBalance(),
                description));

        WalletTransaction outgoing = WalletTransaction.transferEntry(
                sender,
                transfer,
                referenceGenerator.generateTransactionReference(),
                transferReference + "-OUT",
                TransactionType.TRANSFER_OUT,
                request.amount(),
                senderBefore,
                sender.getBalance(),
                description);
        WalletTransaction incoming = WalletTransaction.transferEntry(
                recipient,
                transfer,
                referenceGenerator.generateTransactionReference(),
                transferReference + "-IN",
                TransactionType.TRANSFER_IN,
                request.amount(),
                recipientBefore,
                recipient.getBalance(),
                description);
        transactions.saveAll(List.of(outgoing, incoming));

        return InternalTransferResponse.from(transfer);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WalletTransactionResponse> getTransactions(
            Long userId, TransactionType type, Pageable pageable) {
        Wallet wallet = wallets.findDefaultByUserId(userId)
                .orElseThrow(() -> new AppException(WalletErrorCode.WALLET_NOT_FOUND));

        Page<WalletTransaction> result = type == null
                ? transactions.findAllByWalletIdOrderByCreatedAtDesc(wallet.getId(), pageable)
                : transactions.findAllByWalletIdAndTypeOrderByCreatedAtDesc(wallet.getId(), type, pageable);

        return result.map(WalletTransactionResponse::from);
    }

    private WalletTransactionResponse execute(
            Long userId,
            String idempotencyKey,
            WalletOperationRequest request,
            TransactionType type) {
        validateTransactionAmount(request.amount());
        validateDescription(request.description());
        validateIdempotencyKey(idempotencyKey);
        accountService.verifyTransactionPin(userId, request.pin());

        Wallet wallet = wallets.findDefaultByUserIdForUpdate(userId)
                .orElseThrow(() -> new AppException(WalletErrorCode.WALLET_NOT_FOUND));

        var existing = transactions.findByWalletIdAndIdempotencyKey(wallet.getId(), idempotencyKey);
        if (existing.isPresent()) {
            WalletTransaction previous = existing.get();
            validateRetry(previous, type, request.amount());
            return WalletTransactionResponse.from(previous);
        }

        BigDecimal balanceBefore = wallet.getBalance();
        try {
            if (type == TransactionType.DEPOSIT) {
                wallet.deposit(request.amount());
            } else {
                wallet.withdraw(request.amount());
            }
        } catch (InvalidWalletAmountException exception) {
            throw new AppException(WalletErrorCode.INVALID_AMOUNT);
        } catch (InsufficientBalanceException exception) {
            throw new AppException(WalletErrorCode.INSUFFICIENT_BALANCE);
        } catch (WalletBalanceLimitExceededException exception) {
            throw new AppException(WalletErrorCode.WALLET_BALANCE_LIMIT_EXCEEDED);
        }

        WalletTransaction transaction = WalletTransaction.success(
                wallet,
                referenceGenerator.generateTransactionReference(),
                idempotencyKey,
                type,
                request.amount(),
                balanceBefore,
                wallet.getBalance(),
                normalizeDescription(request.description())
        );

        return WalletTransactionResponse.from(transactions.save(transaction));
    }

    private void validateRetry(
            WalletTransaction previous, TransactionType requestedType, BigDecimal requestedAmount) {
        boolean sameType = previous.getType() == requestedType;
        boolean sameAmount = previous.getAmount().compareTo(requestedAmount) == 0;
        if (!sameType || !sameAmount) {
            throw new AppException(WalletErrorCode.IDEMPOTENCY_CONFLICT);
        }
    }

    private void validateIdempotencyKey(String key) {
        if (key == null || key.isBlank() || key.length() > IDEMPOTENCY_KEY_MAX_LENGTH) {
            throw new AppException(WalletErrorCode.INVALID_IDEMPOTENCY_KEY);
        }
    }

    private void validateTransactionAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(MIN_TRANSACTION_AMOUNT) < 0) {
            throw new AppException(WalletErrorCode.INVALID_AMOUNT);
        }
        if (amount.compareTo(MAX_TRANSACTION_AMOUNT) > 0) {
            throw new AppException(WalletErrorCode.TRANSACTION_AMOUNT_EXCEEDED);
        }
    }

    private void validateDescription(String description) {
        if (description != null && description.length() > DESCRIPTION_MAX_LENGTH) {
            throw new AppException(WalletErrorCode.DESCRIPTION_TOO_LONG);
        }
    }

    private String normalizeDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }
}
