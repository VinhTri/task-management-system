package com.smartspend.customer.wallet.dto;

import com.smartspend.transaction.entity.WalletTransaction;
import com.smartspend.transaction.enums.TransactionType;

import java.math.BigDecimal;
import java.time.Instant;

public record WalletTransactionResponse(
        Long id,
        String referenceCode,
        String type,
        String status,
        String transferReference,
        String counterpartyAccountNumber,
        BigDecimal amount,
        BigDecimal balanceBefore,
        BigDecimal balanceAfter,
        String currency,
        String description,
        Instant createdAt
) {
    public static WalletTransactionResponse from(WalletTransaction transaction) {
        String transferReference = null;
        String counterpartyAccountNumber = null;
        if (transaction.getTransfer() != null) {
            transferReference = transaction.getTransfer().getReferenceCode();
            counterpartyAccountNumber = transaction.getType() == TransactionType.TRANSFER_OUT
                    ? transaction.getTransfer().getRecipientWallet().getAccount().getAccountNumber()
                    : transaction.getTransfer().getSenderWallet().getAccount().getAccountNumber();
        }
        return new WalletTransactionResponse(
                transaction.getId(),
                transaction.getReferenceCode(),
                transaction.getType().name(),
                transaction.getStatus().name(),
                transferReference,
                counterpartyAccountNumber,
                transaction.getAmount(),
                transaction.getBalanceBefore(),
                transaction.getBalanceAfter(),
                transaction.getWallet().getCurrency(),
                transaction.getDescription(),
                transaction.getCreatedAt()
        );
    }
}
