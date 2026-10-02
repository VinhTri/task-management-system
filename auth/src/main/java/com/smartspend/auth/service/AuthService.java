package com.smartspend.auth.service;

import com.smartspend.auth.dto.request.LoginRequest;
import com.smartspend.auth.dto.request.RefreshRequest;
import com.smartspend.auth.dto.request.RegisterRequest;
import com.smartspend.auth.dto.request.SendOtpRequest;
import com.smartspend.auth.dto.response.AuthResponse;
import com.smartspend.user.enums.Role;

public interface AuthService {
    void requestRegistrationOtp(SendOtpRequest request);
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request, Role requiredRole);
    void requestPasswordResetOtp(SendOtpRequest request);
    AuthResponse refresh(RefreshRequest request);
    void logout(RefreshRequest request);
}
