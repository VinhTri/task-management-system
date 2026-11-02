package com.smartspend.customer.account.service.impl;

import com.smartspend.auth.crypto.HmacService;
import com.smartspend.auth.config.AuthProperties;
import com.smartspend.auth.dto.request.VerifyOtpRequest;
import com.smartspend.auth.dto.response.ResetTokenResponse;
import com.smartspend.customer.account.AccountNumberGenerator;
import com.smartspend.customer.account.dto.response.AccountOverviewResponse;
import com.smartspend.customer.account.dto.response.PinStatusResponse;
import com.smartspend.customer.account.dto.response.OtpDeliveryResponse;
import com.smartspend.customer.account.dto.request.SetupPinRequest;
import com.smartspend.customer.account.dto.request.ResetPinRequest;
import com.smartspend.customer.wallet.dto.response.WalletResponse;
import com.smartspend.customer.account.exception.AccountErrorCode;
import com.smartspend.customer.account.service.CustomerAccountService;
import com.smartspend.customer.account.store.PinAttemptStore;
import com.smartspend.customer.account.store.PinResetTokenStore;
import com.smartspend.account.entity.CustomerAccount;
import com.smartspend.account.repository.CustomerAccountRepository;
import com.smartspend.common.exception.AppException;
import com.smartspend.user.entity.User;
import com.smartspend.user.repository.UserRepository;
import com.smartspend.user.EmailNormalizer;
import com.smartspend.otp.model.OtpPurpose;
import com.smartspend.otp.service.OtpService;
import com.smartspend.otp.config.OtpProperties;
import com.smartspend.wallet.entity.Wallet;
import com.smartspend.wallet.repository.WalletRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.security.SecureRandom;
import java.util.Base64;

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
    private final PinAttemptStore pinAttempts;
    private final PinResetTokenStore pinResetTokens;
    private final OtpService otpService;
    private final AuthProperties authProperties;
    private final OtpProperties otpProperties;
    private final SecureRandom random = new SecureRandom();

    public CustomerAccountServiceImpl(UserRepository users, CustomerAccountRepository accounts,
                                      WalletRepository wallets, PasswordEncoder passwordEncoder,
                                      HmacService hmac, AccountNumberGenerator accountNumberGenerator,
                                      PinAttemptStore pinAttempts, PinResetTokenStore pinResetTokens,
                                      OtpService otpService, AuthProperties authProperties,
                                      OtpProperties otpProperties) {
        this.users = users;
        this.accounts = accounts;
        this.wallets = wallets;
        this.passwordEncoder = passwordEncoder;
        this.hmac = hmac;
        this.accountNumberGenerator = accountNumberGenerator;
        this.pinAttempts = pinAttempts;
        this.pinResetTokens = pinResetTokens;
        this.otpService = otpService;
        this.authProperties = authProperties;
        this.otpProperties = otpProperties;
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
        if (pinAttempts.isLocked(userId)) {
            throw new AppException(AccountErrorCode.TRANSACTION_PIN_LOCKED);
        }
        CustomerAccount account = accounts.findByUserId(userId)
                .orElseThrow(() -> new AppException(AccountErrorCode.ACCOUNT_NOT_CONFIGURED));
        if (!passwordEncoder.matches(pinDigest(rawPin), account.getPinHash())) {
            if (pinAttempts.increment(userId) >= 3) {
                throw new AppException(AccountErrorCode.TRANSACTION_PIN_LOCKED);
            }
            throw new AppException(AccountErrorCode.INVALID_TRANSACTION_PIN);
        }
        pinAttempts.clear(userId);
    }

    @Override
    public PinStatusResponse getPinStatus(Long userId) {
        return PinStatusResponse.from(pinAttempts.attempts(userId));
    }

    @Override
    public OtpDeliveryResponse requestPinReset(Long userId, String rawEmail, String ipAddress, String deviceId) {
        User user = users.findById(userId)
                .orElseThrow(() -> new AppException(AccountErrorCode.USER_NOT_FOUND));
        String email = EmailNormalizer.normalize(rawEmail);
        if (!user.getEmail().equals(email)) {
            throw new AppException(AccountErrorCode.PIN_RESET_EMAIL_MISMATCH);
        }
        otpService.send(email, OtpPurpose.RESET_PIN, ipAddress, deviceId);
        long expiresInSeconds = otpProperties.ttl().toSeconds();
        return new OtpDeliveryResponse(expiresInSeconds, expiresInSeconds);
    }

    @Override
    public ResetTokenResponse verifyPinResetOtp(Long userId, VerifyOtpRequest request) {
        User user = users.findById(userId)
                .orElseThrow(() -> new AppException(AccountErrorCode.USER_NOT_FOUND));
        String email = EmailNormalizer.normalize(request.email());
        if (!user.getEmail().equals(email)) {
            throw new AppException(AccountErrorCode.PIN_RESET_EMAIL_MISMATCH);
        }
        otpService.verifyForPinReset(email, request.otp());
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        pinResetTokens.save(hmac.hash(rawToken), userId, authProperties.resetTokenTtl());
        return new ResetTokenResponse(rawToken, authProperties.resetTokenTtl().toSeconds());
    }

    @Override
    @Transactional
    public void resetPin(Long userId, ResetPinRequest request) {
        if (!request.pin().equals(request.confirmPin())) {
            throw new AppException(AccountErrorCode.PIN_CONFIRMATION_MISMATCH);
        }
        validatePinStrength(request.pin());
        Long tokenUserId = pinResetTokens.consume(hmac.hash(request.resetToken()))
                .orElseThrow(() -> new AppException(AccountErrorCode.INVALID_PIN_RESET_TOKEN));
        if (!tokenUserId.equals(userId)) {
            throw new AppException(AccountErrorCode.INVALID_PIN_RESET_TOKEN);
        }
        CustomerAccount account = accounts.findByUserId(userId)
                .orElseThrow(() -> new AppException(AccountErrorCode.ACCOUNT_NOT_CONFIGURED));
        account.changePin(passwordEncoder.encode(pinDigest(request.pin())));
        pinAttempts.clear(userId);
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
