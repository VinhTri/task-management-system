package com.smartspend.common.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AppException.class)
    ResponseEntity<ApiResponse<Void>> handleAppException(AppException exception) {
        ErrorCode error = exception.getErrorCode();
        return ResponseEntity.status(error.status()).body(ApiResponse.failure(error.code(), error.message()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst().map(error -> error.getField() + ": " + error.getDefaultMessage())
                .orElse(CommonErrorCode.VALIDATION_FAILED.message());
        return ResponseEntity.badRequest().body(ApiResponse.failure(CommonErrorCode.VALIDATION_FAILED.code(), message));
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    ResponseEntity<ApiResponse<Void>> handleOptimisticLock(OptimisticLockingFailureException exception) {
        CommonErrorCode error = CommonErrorCode.CONCURRENT_MODIFICATION;
        return ResponseEntity.status(error.status()).body(ApiResponse.failure(error.code(), error.message()));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception exception) {
        log.error("Unhandled exception", exception);
        CommonErrorCode error = CommonErrorCode.INTERNAL_ERROR;
        return ResponseEntity.status(error.status()).body(ApiResponse.failure(error.code(), error.message()));
    }
}

