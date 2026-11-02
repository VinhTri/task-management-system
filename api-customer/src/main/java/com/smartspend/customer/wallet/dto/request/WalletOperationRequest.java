package com.smartspend.customer.wallet.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record WalletOperationRequest(
        @NotNull(message = "Số tiền không được để trống")
        @DecimalMax(value = "1000000000", message = "Mỗi giao dịch không được vượt quá 1.000.000.000 VND")
        @DecimalMin(value = "2000", message = "Số tiền tối thiểu là 2.000 VND")
        @Digits(integer = 10, fraction = 2, message = "Số tiền không hợp lệ")
        BigDecimal amount,

        @NotNull(message = "Mã PIN không được để trống")
        @Pattern(regexp = "\\d{6}", message = "Mã PIN phải gồm đúng 6 chữ số")
        String pin,

        @Size(max = 255, message = "Nội dung không được vượt quá 255 ký tự")
        String description
) {}
