package com.smartspend.auth.service;

import com.smartspend.auth.dto.request.LoginRequest;
import com.smartspend.auth.dto.request.RefreshRequest;
import com.smartspend.auth.dto.request.RegisterRequest;
import com.smartspend.auth.dto.request.SendOtpRequest;
import com.smartspend.auth.dto.request.VerifyOtpRequest;
import com.smartspend.auth.dto.response.AuthResponse;
import com.smartspend.auth.dto.response.RegistrationTokenResponse;
import com.smartspend.auth.dto.response.OtpDeliveryResponse;
import com.smartspend.user.enums.Role;

public interface AuthService {
    OtpDeliveryResponse requestRegistrationOtp(SendOtpRequest request, String ipAddress, String deviceId);
    RegistrationTokenResponse verifyRegistrationOtp(VerifyOtpRequest request);
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request, Role requiredRole);
    OtpDeliveryResponse requestPasswordResetOtp(SendOtpRequest request, String ipAddress, String deviceId);
    AuthResponse refresh(RefreshRequest request);
    void logout(RefreshRequest request);
}
