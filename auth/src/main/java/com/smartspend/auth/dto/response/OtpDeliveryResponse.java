package com.smartspend.auth.dto.response;

public record OtpDeliveryResponse(long expiresInSeconds, long resendAfterSeconds) {
}
