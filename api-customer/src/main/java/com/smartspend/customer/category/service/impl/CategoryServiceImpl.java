package com.smartspend.customer.category.service.impl;

import com.smartspend.customer.category.CategoryCache;
import com.smartspend.customer.category.dto.request.CategoryRequest;
import com.smartspend.customer.category.dto.response.CategoryResponse;
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
    private static final long MAX_ACTIVE_CATEGORIES = 60;
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
        String icon = request.icon().trim();
        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new AppException(CategoryErrorCode.USER_NOT_FOUND));
        if (categoryRepository.countByUserIdAndActiveTrue(userId) >= MAX_ACTIVE_CATEGORIES) {
            throw new AppException(CategoryErrorCode.LIMIT_REACHED);
        }
        if (categoryRepository.existsByUserIdAndTypeAndNameIgnoreCaseAndActiveTrue(userId, request.type(), name)) {
            throw new AppException(CategoryErrorCode.NAME_EXISTS);
        }
        if (categoryRepository.existsByUserIdAndTypeAndIconIgnoreCaseAndActiveTrue(userId, request.type(), icon)) {
            throw new AppException(CategoryErrorCode.ICON_EXISTS);
        }
        try {
            Category saved = categoryRepository.saveAndFlush(Category.create(
                    user, name, request.type(), icon, request.color().toUpperCase(Locale.ROOT)));
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
