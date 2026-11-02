package com.smartspend.customer.account.controller;

import com.smartspend.auth.security.AuthenticatedUser;
import com.smartspend.customer.account.dto.response.CurrentUserResponse;
import com.smartspend.customer.account.dto.request.UpdateProfileRequest;
import com.smartspend.customer.account.dto.request.UpdatePreferencesRequest;
import com.smartspend.customer.account.service.CustomerProfileService;
import com.smartspend.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/me")
public class MeController {
    private final CustomerProfileService profiles;

    public MeController(CustomerProfileService profiles) {
        this.profiles = profiles;
    }

    @GetMapping
    public ApiResponse<CurrentUserResponse> me(@AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        return ApiResponse.success("Thông tin tài khoản", profiles.getProfile(authenticatedUser.id()));
    }

    @PatchMapping
    public ApiResponse<CurrentUserResponse> update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.success("Cập nhật hồ sơ thành công", profiles.updateProfile(user.id(), request));
    }

    @PostMapping(value = "/avatar", consumes = "multipart/form-data")
    public ApiResponse<CurrentUserResponse> updateAvatar(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestPart("avatar") MultipartFile avatar) {
        return ApiResponse.success("Cập nhật avatar thành công", profiles.updateAvatar(user.id(), avatar));
    }

    @PatchMapping("/preferences")
    public ApiResponse<CurrentUserResponse> updatePreferences(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody UpdatePreferencesRequest request) {
        return ApiResponse.success("Cập nhật cài đặt thành công",
                profiles.updatePreferences(user.id(), request));
    }
}
