package com.smartspend.otp.exception;

import com.smartspend.common.exception.ErrorCode;
import org.springframework.http.HttpStatus;

public enum OtpErrorCode implements ErrorCode {
    INVALID_OTP("AUTH_004", "OTP không hợp lệ", HttpStatus.BAD_REQUEST),
    OTP_EXPIRED("AUTH_005", "OTP đã hết hạn hoặc không tồn tại", HttpStatus.BAD_REQUEST),
    OTP_ATTEMPTS_EXCEEDED("AUTH_006", "OTP đã bị khóa do nhập sai quá nhiều lần", HttpStatus.TOO_MANY_REQUESTS),
    OTP_SEND_TOO_SOON("AUTH_007", "Vui lòng chờ trước khi yêu cầu OTP mới", HttpStatus.TOO_MANY_REQUESTS),
    OTP_SEND_LIMIT_EXCEEDED("AUTH_008", "Đã vượt quá số lần gửi OTP", HttpStatus.TOO_MANY_REQUESTS),
    OTP_EMAIL_TEMPORARILY_BLOCKED("AUTH_015", "Email tạm thời bị khóa gửi OTP", HttpStatus.TOO_MANY_REQUESTS),
    OTP_CLIENT_BLOCKED("AUTH_016", "Thiết bị hoặc địa chỉ mạng tạm thời bị khóa gửi OTP", HttpStatus.TOO_MANY_REQUESTS);

    private final String code;
    private final String message;
    private final HttpStatus status;

    OtpErrorCode(String code, String message, HttpStatus status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }

    @Override public String code() { return code; }
    @Override public String message() { return message; }
    @Override public HttpStatus status() { return status; }
}
