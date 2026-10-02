package com.smartspend.customer.category.dto;

import com.smartspend.category.entity.Category;
import com.smartspend.category.entity.CategoryType;

public record CategoryResponse(
        Long id,
        String name,
        CategoryType type,
        String icon,
        String color,
        long version
) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getType(),
                category.getIcon(), category.getColor(), category.getVersion());
    }
}
