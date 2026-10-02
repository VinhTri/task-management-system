package com.smartspend.auth.mail;

import com.smartspend.auth.otp.model.OtpPurpose;

public interface MailGateway {
    void sendOtp(String recipient, String otp, OtpPurpose purpose);
}