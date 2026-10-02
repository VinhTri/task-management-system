package com.smartspend.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        String code,
        String message,
        T data,
        Instant timestamp
) {

    public static <T> ApiResponse<T> success(
            String message,
            T data
    ) {
        return new ApiResponse<>(
                true,
                "SUCCESS",
                message,
                data,
                Instant.now()
        );
    }

    public static ApiResponse<Void> success(
            String message
    ) {
        return success(message, null);
    }

    public static ApiResponse<Void> failure(
            String code,
            String message
    ) {
        return new ApiResponse<>(
                false,
                code,
                message,
                null,
                Instant.now()
        );
    }
}
