package com.smartspend.auth.otp.service;

import com.smartspend.auth.otp.model.OtpPurpose;

public interface OtpService {
    void send(String email, OtpPurpose purpose);

    void verifyAndConsume(String email, String code, OtpPurpose purpose);

    void verifyForPasswordReset(String email, String code);
}
