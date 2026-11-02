package com.smartspend.otp.mail;

import com.smartspend.otp.model.OtpPurpose;

public interface MailGateway {
    void sendOtp(String recipient, String otp, OtpPurpose purpose);
}