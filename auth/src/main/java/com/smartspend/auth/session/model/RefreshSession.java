package com.smartspend.auth.session.model;

import com.smartspend.user.enums.Role;

public record RefreshSession(String id, Long userId, String email, Role role, String secretHash) {
}
