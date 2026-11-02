package com.smartspend.auth.dto.response;

public record RegistrationTokenResponse(
        String verificationToken,
        long expiresInSeconds
) {}
