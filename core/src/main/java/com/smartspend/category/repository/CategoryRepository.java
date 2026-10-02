package com.smartspend.category.repository;

import com.smartspend.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findAllByUserIdAndActiveTrueOrderByTypeAscNameAsc(Long userId);
    Optional<Category> findByIdAndUserIdAndActiveTrue(Long id, Long userId);
    boolean existsByUserIdAndNameIgnoreCaseAndActiveTrue(Long userId, String name);
    boolean existsByUserIdAndNameIgnoreCaseAndActiveTrueAndIdNot(Long userId, String name, Long id);
}
