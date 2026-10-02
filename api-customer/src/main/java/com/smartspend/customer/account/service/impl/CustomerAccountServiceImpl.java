package com.smartspend.customer.account.service.impl;

import com.smartspend.auth.crypto.HmacService;
import com.smartspend.customer.account.AccountNumberGenerator;
import com.smartspend.customer.account.dto.AccountOverviewResponse;
import com.smartspend.customer.account.dto.SetupPinRequest;
import com.smartspend.customer.wallet.dto.WalletResponse;
import com.smartspend.customer.account.exception.AccountErrorCode;
import com.smartspend.customer.account.service.CustomerAccountService;
import com.smartspend.account.entity.CustomerAccount;
import com.smartspend.account.repository.CustomerAccountRepository;
import com.smartspend.common.exception.AppException;
import com.smartspend.user.entity.User;
import com.smartspend.user.repository.UserRepository;
import com.smartspend.wallet.entity.Wallet;
import com.smartspend.wallet.repository.WalletRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
public class CustomerAccountServiceImpl implements CustomerAccountService {
    private static final int ACCOUNT_NUMBER_ATTEMPTS = 20;
    private static final Set<String> EASY_PINS = Set.of(
            "012345", "123456", "234567", "345678", "456789",
            "987654", "876543", "765432", "654321", "543210"
    );

    private final UserRepository users;
    private final CustomerAccountRepository accounts;
    private final WalletRepository wallets;
    private final PasswordEncoder passwordEncoder;
    private final HmacService hmac;
    private final AccountNumberGenerator accountNumberGenerator;

    public CustomerAccountServiceImpl(UserRepository users, CustomerAccountRepository accounts,
                                      WalletRepository wallets, PasswordEncoder passwordEncoder,
                                      HmacService hmac, AccountNumberGenerator accountNumberGenerator) {
        this.users = users;
        this.accounts = accounts;
        this.wallets = wallets;
        this.passwordEncoder = passwordEncoder;
        this.hmac = hmac;
        this.accountNumberGenerator = accountNumberGenerator;
    }

    @Override
    @Transactional(readOnly = true)
    public AccountOverviewResponse getOverview(Long userId) {
        return accounts.findByUserId(userId)
                .map(this::toOverview)
                .orElseGet(AccountOverviewResponse::notConfigured);
    }

    @Override
    @Transactional
    public AccountOverviewResponse setupPin(Long userId, SetupPinRequest request) {
        if (!request.pin().equals(request.confirmPin())) {
            throw new AppException(AccountErrorCode.PIN_CONFIRMATION_MISMATCH);
        }
        validatePinStrength(request.pin());

        User user = users.findByIdForUpdate(userId)
                .orElseThrow(() -> new AppException(AccountErrorCode.USER_NOT_FOUND));
        if (accounts.existsByUserId(userId)) {
            throw new AppException(AccountErrorCode.ACCOUNT_ALREADY_CONFIGURED);
        }

        String accountNumber = generateUniqueAccountNumber();
        CustomerAccount account = accounts.save(CustomerAccount.open(
                user, accountNumber, passwordEncoder.encode(pinDigest(request.pin()))));
        Wallet wallet = wallets.save(Wallet.createDefault(account));
        return toOverview(account, wallet);
    }

    @Override
    @Transactional(readOnly = true)
    public void verifyTransactionPin(Long userId, String rawPin) {
        CustomerAccount account = accounts.findByUserId(userId)
                .orElseThrow(() -> new AppException(AccountErrorCode.ACCOUNT_NOT_CONFIGURED));
        if (!passwordEncoder.matches(pinDigest(rawPin), account.getPinHash())) {
            throw new AppException(AccountErrorCode.INVALID_TRANSACTION_PIN);
        }
    }

    private AccountOverviewResponse toOverview(CustomerAccount account) {
        Wallet wallet = wallets.findByAccountIdAndDefaultWalletTrue(account.getId())
                .orElseThrow(() -> new AppException(AccountErrorCode.DEFAULT_WALLET_NOT_FOUND));
        return toOverview(account, wallet);
    }

    private AccountOverviewResponse toOverview(CustomerAccount account, Wallet wallet) {
        return new AccountOverviewResponse(true, account.getAccountNumber(), WalletResponse.from(wallet));
    }

    private String generateUniqueAccountNumber() {
        for (int attempt = 0; attempt < ACCOUNT_NUMBER_ATTEMPTS; attempt++) {
            String candidate = accountNumberGenerator.generate();
            if (!accounts.existsByAccountNumber(candidate)) return candidate;
        }
        throw new AppException(AccountErrorCode.ACCOUNT_NUMBER_GENERATION_FAILED);
    }

    private void validatePinStrength(String pin) {
        boolean repeated = pin.chars().allMatch(character -> character == pin.charAt(0));
        if (repeated || EASY_PINS.contains(pin)) {
            throw new AppException(AccountErrorCode.WEAK_TRANSACTION_PIN);
        }
    }

    private String pinDigest(String pin) {
        return hmac.hash("transaction-pin:" + pin);
    }
}
