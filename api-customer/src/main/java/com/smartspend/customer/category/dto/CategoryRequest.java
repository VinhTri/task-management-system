package com.smartspend.customer.category.dto;

import com.smartspend.category.entity.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank(message = "Tên danh mục không được để trống")
        @Size(max = 80, message = "Tên danh mục tối đa 80 ký tự")
        String name,

        @NotNull(message = "Loại danh mục không được để trống")
        CategoryType type,

        @NotBlank(message = "Biểu tượng không được để trống")
        @Size(max = 50, message = "Tên biểu tượng tối đa 50 ký tự")
        @Pattern(regexp = "^[a-zA-Z0-9-]+$", message = "Biểu tượng không hợp lệ")
        String icon,

        @NotBlank(message = "Màu không được để trống")
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Màu phải có định dạng #RRGGBB")
        String color
) {}
