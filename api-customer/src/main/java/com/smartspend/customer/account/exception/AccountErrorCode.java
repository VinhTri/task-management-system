package com.smartspend.customer.account.exception;

import com.smartspend.common.exception.ErrorCode;
import org.springframework.http.HttpStatus;

public enum AccountErrorCode implements ErrorCode {
    ACCOUNT_ALREADY_CONFIGURED("ACCOUNT_001", "Tài khoản đã được thiết lập PIN", HttpStatus.CONFLICT),
    PIN_CONFIRMATION_MISMATCH("ACCOUNT_002", "Mã PIN xác nhận không khớp", HttpStatus.BAD_REQUEST),
    WEAK_TRANSACTION_PIN("ACCOUNT_003", "Mã PIN không được là dãy số liên tiếp hoặc lặp lại", HttpStatus.BAD_REQUEST),
    ACCOUNT_NOT_CONFIGURED("ACCOUNT_004", "Tài khoản chưa được thiết lập PIN", HttpStatus.CONFLICT),
    INVALID_TRANSACTION_PIN("ACCOUNT_005", "Mã PIN giao dịch không chính xác", HttpStatus.UNAUTHORIZED),
    ACCOUNT_NUMBER_GENERATION_FAILED("ACCOUNT_006", "Không thể tạo số tài khoản", HttpStatus.INTERNAL_SERVER_ERROR),
    DEFAULT_WALLET_NOT_FOUND("ACCOUNT_007", "Không tìm thấy ví mặc định", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_NOT_FOUND("ACCOUNT_008", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND);

    private final String code;
    private final String message;
    private final HttpStatus status;

    AccountErrorCode(String code, String message, HttpStatus status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }

    @Override public String code() { return code; }
    @Override public String message() { return message; }
    @Override public HttpStatus status() { return status; }
}
