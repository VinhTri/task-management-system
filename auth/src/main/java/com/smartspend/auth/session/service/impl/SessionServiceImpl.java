package com.smartspend.auth.session.service.impl;

import com.smartspend.auth.config.AuthProperties;
import com.smartspend.auth.crypto.HmacService;
import com.smartspend.auth.dto.response.AuthResponse;
import com.smartspend.auth.exception.AuthErrorCode;
import com.smartspend.auth.session.model.RefreshSession;
import com.smartspend.auth.session.service.SessionService;
import com.smartspend.auth.session.store.RefreshSessionStore;
import com.smartspend.auth.token.JwtService;
import com.smartspend.common.exception.AppException;
import com.smartspend.user.entity.User;
import com.smartspend.user.enums.Role;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

@Service
public class SessionServiceImpl implements SessionService {
    private final RefreshSessionStore sessions;
    private final JwtService jwtService;
    private final HmacService hmac;
    private final AuthProperties properties;
    private final SecureRandom random = new SecureRandom();

    public SessionServiceImpl(RefreshSessionStore sessions, JwtService jwtService,
                              HmacService hmac, AuthProperties properties) {
        this.sessions = sessions;
        this.jwtService = jwtService;
        this.hmac = hmac;
        this.properties = properties;
    }

    @Override
    public AuthResponse create(User user) {
        // Mỗi tài khoản chỉ có một phiên hoạt động: đăng nhập mới thu hồi mọi phiên cũ.
        sessions.deleteAllForUser(user.getId());
        return create(user.getId(), user.getEmail(), user.getRole());
    }

    @Override
    public AuthResponse refresh(String refreshToken) {
        TokenParts parts = parse(refreshToken);
        RefreshSession old = sessions.consume(parts.sessionId(), hmac.hash(parts.secret()))
                .orElseThrow(() -> new AppException(AuthErrorCode.INVALID_REFRESH_TOKEN));
        // consume() là thao tác Redis atomic: chỉ một request có thể rotate token cũ.
        return create(old.userId(), old.email(), old.role());
    }

    @Override
    public void logout(String refreshToken) {
        try {
            TokenParts parts = parse(refreshToken);
            sessions.consume(parts.sessionId(), hmac.hash(parts.secret()));
        } catch (AppException ignored) {
            // Logout có tính idempotent.
        }
    }

    @Override
    public void revokeAll(Long userId) {
        sessions.deleteAllForUser(userId);
    }

    private AuthResponse create(Long userId, String email, Role role) {
        String sessionId = UUID.randomUUID().toString();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String secret = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        sessions.save(new RefreshSession(sessionId, userId, email, role, hmac.hash(secret)),
                properties.refreshTokenTtl());
        return new AuthResponse(
                jwtService.createAccessToken(userId, email, role, sessionId),
                properties.accessTokenTtl().toSeconds(),
                sessionId + "." + secret,
                properties.refreshTokenTtl().toSeconds(),
                "Bearer"
        );
    }

    private TokenParts parse(String token) {
        int dot = token == null ? -1 : token.indexOf('.');
        if (dot < 1 || dot == token.length() - 1) throw new AppException(AuthErrorCode.INVALID_REFRESH_TOKEN);
        return new TokenParts(token.substring(0, dot), token.substring(dot + 1));
    }

    private record TokenParts(String sessionId, String secret) {}
}
