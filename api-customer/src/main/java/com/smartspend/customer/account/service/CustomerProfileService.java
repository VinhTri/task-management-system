package com.smartspend.customer.account.service;

import com.smartspend.customer.account.dto.request.UpdateProfileRequest;
import com.smartspend.customer.account.dto.request.UpdatePreferencesRequest;
import com.smartspend.customer.account.dto.response.CurrentUserResponse;
import org.springframework.web.multipart.MultipartFile;

public interface CustomerProfileService {
    CurrentUserResponse getProfile(Long userId);
    CurrentUserResponse updateProfile(Long userId, UpdateProfileRequest request);
    CurrentUserResponse updateAvatar(Long userId, MultipartFile file);
    CurrentUserResponse updatePreferences(Long userId, UpdatePreferencesRequest request);
}
