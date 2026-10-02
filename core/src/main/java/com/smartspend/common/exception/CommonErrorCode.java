package com.smartspend.common.exception;

import org.springframework.http.HttpStatus;

public enum CommonErrorCode implements ErrorCode {
    VALIDATION_FAILED("COMMON_001", "Dữ liệu đầu vào không hợp lệ", HttpStatus.BAD_REQUEST),
    CONCURRENT_MODIFICATION("COMMON_002", "Dữ liệu vừa được thay đổi, vui lòng tải lại và thử lại", HttpStatus.CONFLICT),
    INTERNAL_ERROR("COMMON_999", "Hệ thống đang bận, vui lòng thử lại", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String code;
    private final String message;
    private final HttpStatus status;

    CommonErrorCode(String code, String message, HttpStatus status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }

    public String code() { return code; }
    public String message() { return message; }
    public HttpStatus status() { return status; }
}