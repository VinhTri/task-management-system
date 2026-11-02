package com.smartspend.customer.common.web;

public record ClientIdentity(
        String ipAddress,
        String deviceId
) {}
