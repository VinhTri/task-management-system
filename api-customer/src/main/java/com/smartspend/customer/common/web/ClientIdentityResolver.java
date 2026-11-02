package com.smartspend.customer.common.web;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

@Component
public class ClientIdentityResolver {
    private static final String DEVICE_ID_HEADER = "X-Device-Id";
    private static final int MAX_DEVICE_ID_LENGTH = 128;

    public ClientIdentity resolve(HttpServletRequest request) {
        String ipAddress = request.getRemoteAddr();
        String deviceId = request.getHeader(DEVICE_ID_HEADER);

        if (deviceId == null || deviceId.isBlank() || deviceId.length() > MAX_DEVICE_ID_LENGTH) {
            deviceId = "ip-fallback:" + ipAddress;
        }

        return new ClientIdentity(ipAddress, deviceId);
    }
}
