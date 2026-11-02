package com.smartspend.customer.account.dto.response;

public record OtpDeliveryResponse(long expiresInSeconds, long resendAfterSeconds) {}
