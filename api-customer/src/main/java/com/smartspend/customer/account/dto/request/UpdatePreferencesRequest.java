package com.smartspend.customer.account.dto.request;

import com.smartspend.user.enums.UserTheme;
import jakarta.validation.constraints.NotNull;

public record UpdatePreferencesRequest(
        @NotNull(message = "Chế độ giao diện không được để trống")
        UserTheme theme
) {}
