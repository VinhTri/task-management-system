package com.smartspend.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RefreshRequest(

        @NotBlank(message = "Refresh token không được để trống")
        String refreshToken

) {}