package com.smartspend.customer.category.service;

import com.smartspend.customer.category.dto.request.CategoryRequest;
import com.smartspend.customer.category.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> search(Long userId, String query);

    CategoryResponse create(Long userId, CategoryRequest request);

    void delete(Long userId, Long categoryId);
}
