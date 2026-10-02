package com.smartspend.customer.auth.controller;

import com.smartspend.auth.dto.request.LoginRequest;
import com.smartspend.auth.dto.request.RefreshRequest;
import com.smartspend.auth.dto.request.RegisterRequest;
import com.smartspend.auth.dto.request.ResetPasswordRequest;
import com.smartspend.auth.dto.request.SendOtpRequest;
import com.smartspend.auth.dto.request.VerifyOtpRequest;
import com.smartspend.auth.dto.response.AuthResponse;
import com.smartspend.auth.dto.response.ResetTokenResponse;
import com.smartspend.auth.password.service.PasswordResetService;
import com.smartspend.auth.service.AuthService;
import com.smartspend.common.response.ApiResponse;
import com.smartspend.user.enums.Role;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@SecurityRequirements
public class CustomerAuthController {
    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public CustomerAuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register/otp")
    public ApiResponse<Void> requestRegistrationOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.requestRegistrationOtp(request);
        return ApiResponse.success("OTP đăng ký đã được gửi");
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success("Đăng ký thành công", authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success("Đăng nhập thành công", authService.login(request, Role.USER));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ApiResponse.success("Làm mới phiên thành công", authService.refresh(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request);
        return ApiResponse.success("Đăng xuất thành công");
    }

    @PostMapping("/password/forgot")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody SendOtpRequest request) {
        authService.requestPasswordResetOtp(request);
        return ApiResponse.success("Nếu tài khoản tồn tại, OTP sẽ được gửi đến email");
    }

    @PostMapping("/password/verify-otp")
    public ApiResponse<ResetTokenResponse> verifyPasswordOtp(@Valid @RequestBody VerifyOtpRequest request) {
        return ApiResponse.success("OTP hợp lệ", passwordResetService.verifyOtp(request));
    }

    @PostMapping("/password/reset")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.reset(request);
        return ApiResponse.success("Đặt lại mật khẩu thành công");
    }
}
