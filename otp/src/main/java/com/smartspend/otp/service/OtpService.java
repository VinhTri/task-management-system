package com.smartspend.otp.service;

import com.smartspend.otp.model.OtpPurpose;
import java.time.Duration;

public interface OtpService {
    Duration send(String email, OtpPurpose purpose, String ipAddress, String deviceId);

    void verifyAndConsume(String email, String code, OtpPurpose purpose);

    void verifyForPasswordReset(String email, String code);

    void verifyForPinReset(String email, String code);
}
