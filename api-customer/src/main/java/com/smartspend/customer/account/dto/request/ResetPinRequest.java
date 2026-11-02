package com.smartspend.customer.account.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResetPinRequest(
        @NotBlank String resetToken,
        @NotBlank @Pattern(regexp = "\\d{6}", message = "Mã PIN phải gồm đúng 6 chữ số") String pin,
        @NotBlank @Pattern(regexp = "\\d{6}", message = "Mã PIN xác nhận phải gồm đúng 6 chữ số") String confirmPin
) {}
