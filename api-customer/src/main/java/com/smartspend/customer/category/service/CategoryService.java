package com.smartspend.customer.category.service;

import com.smartspend.customer.category.dto.CategoryRequest;
import com.smartspend.customer.category.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> search(Long userId, String query);

    CategoryResponse create(Long userId, CategoryRequest request);

    CategoryResponse update(Long userId, Long categoryId, CategoryRequest request);

    void delete(Long userId, Long categoryId);
}
