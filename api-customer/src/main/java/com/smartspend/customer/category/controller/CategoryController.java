package com.smartspend.customer.category.controller;

import com.smartspend.auth.security.AuthenticatedUser;
import com.smartspend.customer.category.dto.CategoryRequest;
import com.smartspend.customer.category.dto.CategoryResponse;
import com.smartspend.customer.category.service.CategoryService;
import com.smartspend.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {
    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) { this.categoryService = categoryService; }

    @GetMapping
    public ApiResponse<List<CategoryResponse>> search(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(defaultValue = "") String query) {
        return ApiResponse.success("Danh sách danh mục", categoryService.search(user.id(), query));
    }

    @PostMapping
    public ApiResponse<CategoryResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.success("Tạo danh mục thành công", categoryService.create(user.id(), request));
    }

    @PutMapping("/{categoryId}")
    public ApiResponse<CategoryResponse> update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long categoryId,
            @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.success("Cập nhật danh mục thành công",
                categoryService.update(user.id(), categoryId, request));
    }

    @DeleteMapping("/{categoryId}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long categoryId) {
        categoryService.delete(user.id(), categoryId);
        return ApiResponse.success("Xóa danh mục thành công");
    }
}
