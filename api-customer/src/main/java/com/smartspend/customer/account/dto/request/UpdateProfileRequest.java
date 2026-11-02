package com.smartspend.customer.account.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Tên người dùng không được để trống")
        @Size(min = 3, max = 50, message = "Tên người dùng phải từ 3 đến 50 ký tự")
        @Pattern(regexp = "^[a-zA-Z0-9._-]+$",
                message = "Tên người dùng chỉ được chứa chữ, số, dấu chấm, gạch dưới và gạch ngang")
        String username
) {}
