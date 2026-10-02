package com.smartspend.auth.password.service;

import com.smartspend.auth.dto.request.ResetPasswordRequest;
import com.smartspend.auth.dto.request.VerifyOtpRequest;
import com.smartspend.auth.dto.response.ResetTokenResponse;

public interface PasswordResetService {
    ResetTokenResponse verifyOtp(VerifyOtpRequest request);
    void reset(ResetPasswordRequest request);
}
