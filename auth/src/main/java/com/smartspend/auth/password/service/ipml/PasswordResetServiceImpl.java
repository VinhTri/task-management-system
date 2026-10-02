package com.smartspend.auth.password.service.ipml;

import com.smartspend.common.exception.AppException;
import com.smartspend.auth.config.AuthProperties;
import com.smartspend.auth.crypto.HmacService;
import com.smartspend.auth.dto.request.ResetPasswordRequest;
import com.smartspend.auth.dto.request.VerifyOtpRequest;
import com.smartspend.auth.dto.response.ResetTokenResponse;
import com.smartspend.auth.exception.AuthErrorCode;
import com.smartspend.auth.otp.service.OtpService;
import com.smartspend.auth.password.service.PasswordResetService;
import com.smartspend.auth.password.store.ResetTokenStore;
import com.smartspend.auth.session.service.SessionService;
import com.smartspend.user.entity.User;
import com.smartspend.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Locale;

@Service
public class PasswordResetServiceImpl implements PasswordResetService {
    private final OtpService otpService;
    private final ResetTokenStore resetTokens;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final SessionService sessions;
    private final HmacService hmac;
    private final AuthProperties properties;
    private final SecureRandom random = new SecureRandom();

    public PasswordResetServiceImpl(OtpService otpService, ResetTokenStore resetTokens, UserRepository users,
                                    PasswordEncoder passwordEncoder, SessionService sessions,
                                    HmacService hmac, AuthProperties properties) {
        this.otpService = otpService;
        this.resetTokens = resetTokens;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.sessions = sessions;
        this.hmac = hmac;
        this.properties = properties;
    }

    @Override
    public ResetTokenResponse verifyOtp(VerifyOtpRequest request) {
        String email = normalize(request.email());
        if (!users.existsByEmail(email)) throw new AppException(AuthErrorCode.INVALID_OTP);
        otpService.verifyForPasswordReset(email, request.otp());
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        resetTokens.save(hmac.hash(rawToken), email, properties.resetTokenTtl());
        return new ResetTokenResponse(rawToken, properties.resetTokenTtl().toSeconds());
    }

    @Override
    @Transactional
    public void reset(ResetPasswordRequest request) {
        String email = resetTokens.consume(hmac.hash(request.resetToken()))
                .orElseThrow(() -> new AppException(AuthErrorCode.INVALID_RESET_TOKEN));
        User user = users.findByEmail(email)
                .orElseThrow(() -> new AppException(AuthErrorCode.INVALID_RESET_TOKEN));
        user.changePassword(passwordEncoder.encode(request.newPassword()));
        sessions.revokeAll(user.getId());
    }

    private String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
