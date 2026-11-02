package com.smartspend.customer.category.exception;

import com.smartspend.common.exception.ErrorCode;
import org.springframework.http.HttpStatus;

public enum CategoryErrorCode implements ErrorCode {
    NOT_FOUND("CATEGORY_001", "Không tìm thấy danh mục", HttpStatus.NOT_FOUND),
    NAME_EXISTS("CATEGORY_002", "Tên danh mục đã tồn tại trong loại thu hoặc chi này", HttpStatus.CONFLICT),
    USER_NOT_FOUND("CATEGORY_003", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    CACHE_ERROR("CATEGORY_004", "Không thể đọc dữ liệu danh mục", HttpStatus.SERVICE_UNAVAILABLE),
    ICON_EXISTS("CATEGORY_005", "Biểu tượng đã được sử dụng trong loại thu hoặc chi này", HttpStatus.CONFLICT),
    LIMIT_REACHED("CATEGORY_006", "Bạn chỉ có thể tạo tối đa 60 danh mục", HttpStatus.CONFLICT);

    private final String code;
    private final String message;
    private final HttpStatus status;

    CategoryErrorCode(String code, String message, HttpStatus status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }

    @Override public String code() { return code; }
    @Override public String message() { return message; }
    @Override public HttpStatus status() { return status; }
}
