package com.smartspend.customer.category.service.impl;

import com.smartspend.customer.category.CategoryCache;
import com.smartspend.customer.category.dto.CategoryRequest;
import com.smartspend.customer.category.dto.CategoryResponse;
import com.smartspend.customer.category.exception.CategoryErrorCode;
import com.smartspend.customer.category.service.CategoryService;
import com.smartspend.category.entity.Category;
import com.smartspend.category.repository.CategoryRepository;
import com.smartspend.common.exception.AppException;
import com.smartspend.user.entity.User;
import com.smartspend.user.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.Locale;

@Service
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final CategoryCache cache;

    public CategoryServiceImpl(CategoryRepository categoryRepository, UserRepository userRepository, CategoryCache cache) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.cache = cache;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> search(Long userId, String query) {
        List<CategoryResponse> categories = findAllCached(userId);
        String keyword = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        if (keyword.isEmpty()) return categories;
        return categories.stream()
                .filter(category -> category.name().toLowerCase(Locale.ROOT).contains(keyword))
                .toList();
    }

    @Override
    @Transactional
    public CategoryResponse create(Long userId, CategoryRequest request) {
        String name = normalizeName(request.name());
        if (categoryRepository.existsByUserIdAndNameIgnoreCaseAndActiveTrue(userId, name)) {
            throw new AppException(CategoryErrorCode.NAME_EXISTS);
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(CategoryErrorCode.USER_NOT_FOUND));
        try {
            Category saved = categoryRepository.saveAndFlush(Category.create(
                    user, name, request.type(), request.icon().trim(), request.color().toUpperCase(Locale.ROOT)));
            evictAfterCommit(userId);
            return CategoryResponse.from(saved);
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(CategoryErrorCode.NAME_EXISTS);
        }
    }

    @Override
    @Transactional
    public CategoryResponse update(Long userId, Long categoryId, CategoryRequest request) {
        Category category = ownedActiveCategory(userId, categoryId);
        String name = normalizeName(request.name());
        if (categoryRepository.existsByUserIdAndNameIgnoreCaseAndActiveTrueAndIdNot(userId, name, categoryId)) {
            throw new AppException(CategoryErrorCode.NAME_EXISTS);
        }
        category.update(name, request.type(), request.icon().trim(), request.color().toUpperCase(Locale.ROOT));
        try {
            Category saved = categoryRepository.saveAndFlush(category);
            evictAfterCommit(userId);
            return CategoryResponse.from(saved);
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(CategoryErrorCode.NAME_EXISTS);
        }
    }

    @Override
    @Transactional
    public void delete(Long userId, Long categoryId) {
        Category category = ownedActiveCategory(userId, categoryId);
        category.deactivate();
        categoryRepository.saveAndFlush(category);
        evictAfterCommit(userId);
    }

    private Category ownedActiveCategory(Long userId, Long categoryId) {
        return categoryRepository.findByIdAndUserIdAndActiveTrue(categoryId, userId)
                .orElseThrow(() -> new AppException(CategoryErrorCode.NOT_FOUND));
    }

    private List<CategoryResponse> findAllCached(Long userId) {
        var cached = cache.get(userId);
        if (cached.isPresent()) return cached.get();

        var token = cache.tryLock(userId);
        if (token.isEmpty()) return loadFromDatabase(userId);
        try {
            return cache.get(userId).orElseGet(() -> {
                List<CategoryResponse> result = loadFromDatabase(userId);
                cache.put(userId, result);
                return result;
            });
        } finally {
            cache.unlock(userId, token.get());
        }
    }

    private List<CategoryResponse> loadFromDatabase(Long userId) {
        return categoryRepository.findAllByUserIdAndActiveTrueOrderByTypeAscNameAsc(userId)
                .stream().map(CategoryResponse::from).toList();
    }

    private String normalizeName(String name) {
        return name.trim().replaceAll("\\s+", " ");
    }

    private void evictAfterCommit(Long userId) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            cache.evict(userId);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { cache.evict(userId); }
        });
    }
}
