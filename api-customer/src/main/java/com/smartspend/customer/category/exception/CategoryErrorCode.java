package com.smartspend.customer.category.exception;

import com.smartspend.common.exception.ErrorCode;
import org.springframework.http.HttpStatus;

public enum CategoryErrorCode implements ErrorCode {
    NOT_FOUND("CATEGORY_001", "Không tìm thấy danh mục", HttpStatus.NOT_FOUND),
    NAME_EXISTS("CATEGORY_002", "Tên danh mục đã tồn tại", HttpStatus.CONFLICT),
    USER_NOT_FOUND("CATEGORY_003", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    CACHE_ERROR("CATEGORY_004", "Không thể đọc dữ liệu danh mục", HttpStatus.SERVICE_UNAVAILABLE);

    private final String code;
    private final String message;
    private final HttpStatus status;

    CategoryErrorCode(String code, String message, HttpStatus status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }

    public String code() { return code; }
    public String message() { return message; }
    public HttpStatus status() { return status; }
}
