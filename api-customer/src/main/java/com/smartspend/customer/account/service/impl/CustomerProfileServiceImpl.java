package com.smartspend.customer.account.service.impl;

import com.smartspend.common.exception.AppException;
import com.smartspend.customer.account.dto.request.UpdateProfileRequest;
import com.smartspend.customer.account.dto.request.UpdatePreferencesRequest;
import com.smartspend.customer.account.dto.response.CurrentUserResponse;
import com.smartspend.customer.account.exception.AccountErrorCode;
import com.smartspend.customer.account.service.CustomerProfileService;
import com.smartspend.customer.account.storage.AvatarStorage;
import com.smartspend.user.entity.User;
import com.smartspend.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CustomerProfileServiceImpl implements CustomerProfileService {
    private final UserRepository users;
    private final AvatarStorage avatarStorage;

    public CustomerProfileServiceImpl(UserRepository users, AvatarStorage avatarStorage) {
        this.users = users;
        this.avatarStorage = avatarStorage;
    }

    @Override
    @Transactional(readOnly = true)
    public CurrentUserResponse getProfile(Long userId) {
        return CurrentUserResponse.from(findUser(userId));
    }

    @Override
    @Transactional
    public CurrentUserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = users.findByIdForUpdate(userId)
                .orElseThrow(() -> new AppException(AccountErrorCode.USER_NOT_FOUND));
        String username = request.username().trim();
        if (users.existsByUsernameIgnoreCaseAndIdNot(username, userId)) {
            throw new AppException(AccountErrorCode.USERNAME_ALREADY_EXISTS);
        }
        user.updateUsername(username);
        return CurrentUserResponse.from(user);
    }

    @Override
    @Transactional
    public CurrentUserResponse updateAvatar(Long userId, MultipartFile file) {
        User user = users.findByIdForUpdate(userId)
                .orElseThrow(() -> new AppException(AccountErrorCode.USER_NOT_FOUND));
        String oldAvatarUrl = user.getAvatarUrl();
        String newAvatarUrl = avatarStorage.store(userId, file);
        user.updateAvatarUrl(newAvatarUrl);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { avatarStorage.delete(oldAvatarUrl); }
            @Override public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) avatarStorage.delete(newAvatarUrl);
            }
        });
        return CurrentUserResponse.from(user);
    }

    @Override
    @Transactional
    public CurrentUserResponse updatePreferences(Long userId, UpdatePreferencesRequest request) {
        User user = users.findByIdForUpdate(userId)
                .orElseThrow(() -> new AppException(AccountErrorCode.USER_NOT_FOUND));
        user.updateTheme(request.theme());
        return CurrentUserResponse.from(user);
    }

    private User findUser(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> new AppException(AccountErrorCode.USER_NOT_FOUND));
    }
}
