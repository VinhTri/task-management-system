package com.smartspend.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Phiên xác thực email không được để trống")
        String verificationToken,

        @NotBlank
        @Size(min = 12, max = 72, message = "Mật khẩu phải có ừ 12 đến 72 kí tự")
        @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=\\S+$).+$", message = "Mật khẩu phải có chữ hoa, chữ thường, ký tự đặc biệt và không chứa khoảng trắng")
        String password
) {}
