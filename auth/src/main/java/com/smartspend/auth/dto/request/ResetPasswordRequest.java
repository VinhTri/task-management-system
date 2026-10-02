package com.smartspend.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(

        @NotBlank(message = "Reset token không được để trống")
        String resetToken,

        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Size(min = 12, max = 72, message = "Mật khẩu phải có từ 12 đến 72 ký tự")
        @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=\\S+$).+$", message = "Mật khẩu phải có chữ hoa, chữ thường, ký tự đặc biệt và không chứa khoảng trắng")
        String newPassword

) {}