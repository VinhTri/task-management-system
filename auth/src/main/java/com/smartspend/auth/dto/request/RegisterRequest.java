package com.smartspend.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        @Size(max=320, message = " Email không được vượt quá 320 kí tự")
        String email,

        @NotBlank
        @Size(min = 12, max = 72, message = "Mật khẩu phải có ừ 12 đến 72 kí tự")
        @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=\\S+$).+$", message = "Mật khẩu phải có chữ hoa, chữ thường, ký tự đặc biệt và không chứa khoảng trắng")
        String password,

        @NotBlank
        @Pattern(regexp = "\\d{6}", message = "otp phải có 6 số")
        String otp
) {}
