package com.smartspend.auth.session.service;

import com.smartspend.auth.dto.response.AuthResponse;
import com.smartspend.user.entity.User;

public interface SessionService {
    AuthResponse create(User user);
    AuthResponse refresh(String refreshToken);
    void logout(String refreshToken);
    void revokeAll(Long userId);
}
