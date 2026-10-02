package com.smartspend.auth.otp.model;

public record OtpRecord(
        String codeHash,
        OtpStatus status,
        long attempts) {
}
