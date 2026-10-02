package com.smartspend.auth.service.impl;

import com.smartspend.auth.dto.request.LoginRequest;
import com.smartspend.auth.dto.request.RefreshRequest;
import com.smartspend.auth.dto.request.RegisterRequest;
import com.smartspend.auth.dto.request.SendOtpRequest;
import com.smartspend.auth.dto.response.AuthResponse;
import com.smartspend.auth.exception.AuthErrorCode;
import com.smartspend.auth.otp.model.OtpPurpose;
import com.smartspend.auth.otp.service.OtpService;
import com.smartspend.auth.service.AuthService;
import com.smartspend.auth.session.service.SessionService;
import com.smartspend.common.exception.AppException;
import com.smartspend.user.entity.User;
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

import java.util.Locale;

@Service
public class AuthServiceImpl implements AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);
    private final UserRepository users;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final SessionService sessions;

    public AuthServiceImpl(UserRepository users, OtpService otpService, PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager, SessionService sessions) {
        this.users = users;
        this.otpService = otpService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.sessions = sessions;
    }

    @Override
    public void requestRegistrationOtp(SendOtpRequest request) {
        String email = normalize(request.email());
        if (users.existsByEmail(email)) throw new AppException(AuthErrorCode.EMAIL_ALREADY_EXISTS);
        otpService.send(email, OtpPurpose.REGISTER);
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalize(request.email());
        if (users.existsByEmail(email)) throw new AppException(AuthErrorCode.EMAIL_ALREADY_EXISTS);
        otpService.verifyAndConsume(email, request.otp(), OtpPurpose.REGISTER);
        User user = users.save(User.customer(email, passwordEncoder.encode(request.password())));
        return sessions.create(user);
    }

    @Override
    public AuthResponse login(LoginRequest request, Role requiredRole) {
        String email = normalize(request.email());
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
    public void requestPasswordResetOtp(SendOtpRequest request) {
        String email = normalize(request.email());
        // Luôn trả cùng response ở controller để không làm lộ email có tồn tại.
        users.findByEmail(email).ifPresent(user -> {
            try {
                otpService.send(email, OtpPurpose.RESET_PASSWORD);
            } catch (RuntimeException exception) {
                log.warn("Could not send password reset OTP for an existing account", exception);
            }
        });
    }

    @Override
    public AuthResponse refresh(RefreshRequest request) {
        return sessions.refresh(request.refreshToken());
    }

    @Override
    public void logout(RefreshRequest request) {
        sessions.logout(request.refreshToken());
    }

    private String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
