package com.smartspend.common.exception;

public class AppException extends RuntimeException {
    private final ErrorCode errorCode;
    private final Long retryAfterSeconds;

    public AppException(ErrorCode errorCode) {
        super(errorCode.message());
        this.errorCode = errorCode;
        this.retryAfterSeconds = null;
    }

    public AppException(ErrorCode errorCode, long retryAfterSeconds) {
        super(errorCode.message());
        this.errorCode = errorCode;
        this.retryAfterSeconds = Math.max(1, retryAfterSeconds);
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public Long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
