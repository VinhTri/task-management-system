package com.smartspend.customer.wallet.exception;

import com.smartspend.common.exception.ErrorCode;
import org.springframework.http.HttpStatus;

public enum WalletErrorCode implements ErrorCode {
    WALLET_NOT_FOUND("WALLET_001", "Không tìm thấy ví mặc định", HttpStatus.NOT_FOUND),
    INVALID_AMOUNT("WALLET_002", "Số tiền giao dịch không hợp lệ", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_BALANCE("WALLET_003", "Số dư không đủ để thực hiện giao dịch", HttpStatus.UNPROCESSABLE_ENTITY),
    INVALID_IDEMPOTENCY_KEY("WALLET_004", "Idempotency-Key không hợp lệ", HttpStatus.BAD_REQUEST),
    IDEMPOTENCY_CONFLICT("WALLET_005", "Idempotency-Key đã được dùng cho giao dịch khác", HttpStatus.CONFLICT),
    RECIPIENT_ACCOUNT_NOT_FOUND("WALLET_006", "Không tìm thấy số tài khoản nhận", HttpStatus.NOT_FOUND),
    SELF_TRANSFER_NOT_ALLOWED("WALLET_007", "Không thể chuyển tiền cho chính tài khoản của bạn", HttpStatus.BAD_REQUEST),
    TRANSFER_WALLETS_NOT_FOUND("WALLET_008", "Không thể khóa đầy đủ các ví giao dịch", HttpStatus.CONFLICT);

    private final String code;
    private final String message;
    private final HttpStatus status;

    WalletErrorCode(String code, String message, HttpStatus status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }

    @Override public String code() { return code; }
    @Override public String message() { return message; }
    @Override public HttpStatus status() { return status; }
}
