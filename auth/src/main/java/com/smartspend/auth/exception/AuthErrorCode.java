package com.smartspend.auth.exception;

import com.smartspend.common.exception.ErrorCode;
import org.springframework.http.HttpStatus;

public enum AuthErrorCode implements ErrorCode {
    EMAIL_ALREADY_EXISTS("AUTH_001", "Email đã được đăng ký", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS("AUTH_002", "Email hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED),
    ACCOUNT_DISABLED("AUTH_003", "Tài khoản đã bị vô hiệu hóa", HttpStatus.FORBIDDEN),
    INVALID_OTP("AUTH_004", "OTP không hợp lệ", HttpStatus.BAD_REQUEST),
    OTP_EXPIRED("AUTH_005", "OTP đã hết hạn hoặc không tồn tại", HttpStatus.BAD_REQUEST),
    OTP_ATTEMPTS_EXCEEDED("AUTH_006", "OTP đã bị khóa do nhập sai quá nhiều lần", HttpStatus.TOO_MANY_REQUESTS),
    OTP_SEND_TOO_SOON("AUTH_007", "Vui lòng chờ trước khi yêu cầu OTP mới", HttpStatus.TOO_MANY_REQUESTS),
    OTP_SEND_LIMIT_EXCEEDED("AUTH_008", "Đã vượt quá số lần gửi OTP", HttpStatus.TOO_MANY_REQUESTS),
    INVALID_REFRESH_TOKEN("AUTH_009", "Refresh token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),
    INVALID_RESET_TOKEN("AUTH_010", "Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
    FORBIDDEN_ROLE("AUTH_011", "Tài khoản không có quyền truy cập cổng này", HttpStatus.FORBIDDEN),
    UNAUTHENTICATED("AUTH_012", "Bạn chưa đăng nhập", HttpStatus.UNAUTHORIZED),
    ACCESS_DENIED("AUTH_013", "Bạn không có quyền thực hiện thao tác này", HttpStatus.FORBIDDEN);

    private final String code;
    private final String message;
    private final HttpStatus status;

    AuthErrorCode(String code, String message, HttpStatus status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }

    public String code() { return code; }
    public String message() { return message; }
    public HttpStatus status() { return status; }
}
