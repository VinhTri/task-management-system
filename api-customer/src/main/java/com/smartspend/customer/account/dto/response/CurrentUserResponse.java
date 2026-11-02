package com.smartspend.customer.account.dto.response;

import com.smartspend.user.entity.User;
import com.smartspend.user.enums.Role;
import com.smartspend.user.enums.UserStatus;
import com.smartspend.user.enums.UserTheme;

import java.time.Instant;

public record CurrentUserResponse(
        Long id,
        String email,
        String username,
        String avatarUrl,
        Role role,
        UserStatus status,
        UserTheme theme,
        Instant createdAt
) {
    public static CurrentUserResponse from(User user) {
        return new CurrentUserResponse(
                user.getId(), user.getEmail(), user.getUsername(), user.getAvatarUrl(),
                user.getRole(), user.getStatus(), user.getTheme(), user.getCreatedAt());
    }
}
