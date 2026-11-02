package com.smartspend.auth.service.impl;

import com.smartspend.auth.config.AuthProperties;
import com.smartspend.auth.crypto.HmacService;
import com.smartspend.auth.dto.request.LoginRequest;
import com.smartspend.auth.dto.request.RefreshRequest;
import com.smartspend.auth.dto.request.RegisterRequest;
import com.smartspend.auth.dto.request.SendOtpRequest;
import com.smartspend.auth.dto.request.VerifyOtpRequest;
import com.smartspend.auth.dto.response.AuthResponse;
import com.smartspend.auth.dto.response.RegistrationTokenResponse;
import com.smartspend.auth.dto.response.OtpDeliveryResponse;
import com.smartspend.auth.exception.AuthErrorCode;
import com.smartspend.auth.registration.store.RegistrationTokenStore;
import com.smartspend.otp.model.OtpPurpose;
import com.smartspend.otp.service.OtpService;
import com.smartspend.otp.config.OtpProperties;
import com.smartspend.auth.service.AuthService;
import com.smartspend.auth.session.service.SessionService;
import com.smartspend.common.exception.AppException;
import com.smartspend.user.entity.User;
import com.smartspend.user.EmailNormalizer;
import com.smartspend.user.enums.Role;
import com.smartspend.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;

@Service
public class AuthServiceImpl implements AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);
    private final UserRepository users;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final SessionService sessions;
    private final RegistrationTokenStore registrationTokens;
    private final HmacService hmac;
    private final AuthProperties properties;
    private final OtpProperties otpProperties;
    private final SecureRandom random = new SecureRandom();

    public AuthServiceImpl(UserRepository users, OtpService otpService, PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager, SessionService sessions,
                           RegistrationTokenStore registrationTokens, HmacService hmac,
                           AuthProperties properties, OtpProperties otpProperties) {
        this.users = users;
        this.otpService = otpService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.sessions = sessions;
        this.registrationTokens = registrationTokens;
        this.hmac = hmac;
        this.properties = properties;
        this.otpProperties = otpProperties;
    }
    @Override
    public OtpDeliveryResponse requestRegistrationOtp(SendOtpRequest request, String ipAddress, String deviceId) {
        String email = EmailNormalizer.normalize(request.email());
        if (users.existsByEmail(email)) throw new AppException(AuthErrorCode.EMAIL_ALREADY_EXISTS);
        var resendAfter = otpService.send(email, OtpPurpose.REGISTER, ipAddress, deviceId);
        return delivery(resendAfter.toSeconds());
    }

    @Override
    public RegistrationTokenResponse verifyRegistrationOtp(VerifyOtpRequest request) {
        String email = EmailNormalizer.normalize(request.email());
        if (users.existsByEmail(email)) throw new AppException(AuthErrorCode.EMAIL_ALREADY_EXISTS);
        otpService.verifyAndConsume(email, request.otp(), OtpPurpose.REGISTER);
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        registrationTokens.save(hmac.hash(rawToken), email, properties.registrationTokenTtl());
        return new RegistrationTokenResponse(rawToken, properties.registrationTokenTtl().toSeconds());
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = registrationTokens.consume(hmac.hash(request.verificationToken()))
                .orElseThrow(() -> new AppException(AuthErrorCode.INVALID_REGISTRATION_TOKEN));
        if (users.existsByEmail(email)) throw new AppException(AuthErrorCode.EMAIL_ALREADY_EXISTS);
        User user = users.save(User.customer(email, generateUniqueUsername(email), passwordEncoder.encode(request.password())));
        return sessions.create(user);
    }

    private String generateUniqueUsername(String email) {
        String localPart = email.substring(0, email.indexOf('@'))
                .toLowerCase()
                .replaceAll("[^a-z0-9._-]", "_");
        String base = localPart.length() > 44 ? localPart.substring(0, 44) : localPart;
        String candidate = base;
        int suffix = 2;
        while (users.existsByUsernameIgnoreCase(candidate)) {
            candidate = base + "_" + suffix++;
        }
        return candidate;
    }

    @Override
    public AuthResponse login(LoginRequest request, Role requiredRole) {
        String email = EmailNormalizer.normalize(request.email());
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        } catch (DisabledException exception) {
            throw new AppException(AuthErrorCode.ACCOUNT_DISABLED);
        } catch (AuthenticationException exception) {
            throw new AppException(AuthErrorCode.INVALID_CREDENTIALS);
        }
        User user = users.findByEmail(email).orElseThrow(() -> new AppException(AuthErrorCode.INVALID_CREDENTIALS));
        if (user.getRole() != requiredRole) throw new AppException(AuthErrorCode.FORBIDDEN_ROLE);
        return sessions.create(user);
    }

    @Override
    public OtpDeliveryResponse requestPasswordResetOtp(SendOtpRequest request, String ipAddress, String deviceId) {
        String email = EmailNormalizer.normalize(request.email());
        // Luôn trả cùng response ở controller để không làm lộ email có tồn tại.
        if (users.findByEmail(email).isPresent()) {
            try {
                return delivery(otpService.send(email, OtpPurpose.RESET_PASSWORD, ipAddress, deviceId).toSeconds());
            } catch (AppException exception) {
                if (exception.getRetryAfterSeconds() != null) {
                    return delivery(exception.getRetryAfterSeconds());
                }
                log.warn("Could not send password reset OTP for an existing account", exception);
            } catch (RuntimeException exception) {
                log.warn("Could not send password reset OTP for an existing account", exception);
            }
        }
        return delivery(otpProperties.cooldown().toSeconds());
    }

    private OtpDeliveryResponse delivery(long resendAfterSeconds) {
        return new OtpDeliveryResponse(otpProperties.ttl().toSeconds(), resendAfterSeconds);
    }

    @Override
    public AuthResponse refresh(RefreshRequest request) {
        return sessions.refresh(request.refreshToken());
    }

    @Override
    public void logout(RefreshRequest request) {
        sessions.logout(request.refreshToken());
    }

}
