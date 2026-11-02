package com.smartspend.category.repository;

import com.smartspend.category.entity.Category;
import com.smartspend.category.enums.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findAllByUserIdAndActiveTrueOrderByTypeAscNameAsc(Long userId);
    Optional<Category> findByIdAndUserIdAndActiveTrue(Long id, Long userId);
    long countByUserIdAndActiveTrue(Long userId);
    boolean existsByUserIdAndTypeAndNameIgnoreCaseAndActiveTrue(Long userId, CategoryType type, String name);
    boolean existsByUserIdAndTypeAndIconIgnoreCaseAndActiveTrue(Long userId, CategoryType type, String icon);
}
