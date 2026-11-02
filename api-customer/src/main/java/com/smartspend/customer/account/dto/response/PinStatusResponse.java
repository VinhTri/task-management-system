package com.smartspend.customer.account.dto.response;

public record PinStatusResponse(long failedAttempts, int maxAttempts, boolean locked) {
    public static PinStatusResponse from(long attempts) {
        return new PinStatusResponse(Math.min(attempts, 3), 3, attempts >= 3);
    }
}
