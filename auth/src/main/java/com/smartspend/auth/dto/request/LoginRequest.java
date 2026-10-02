package com.smartspend.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest (
    @NotBlank(message =" Email không được để trống")
    @Email(message = " Email không đúng định dạng")
    @Size(max=320, message = " Email không được vượt quá 320 kí tự")
     String email,

    @NotBlank(message = "Mật khẩu không được để trống")
    String password

){}
