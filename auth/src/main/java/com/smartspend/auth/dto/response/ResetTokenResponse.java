package com.smartspend.auth.dto.response;

public record ResetTokenResponse(
        String resetToken,
        long expiresInSeconds
) {}


