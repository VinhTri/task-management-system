package com.smartspend.customer.account.controller;

import com.smartspend.auth.security.AuthenticatedUser;
import com.smartspend.common.response.ApiResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/me")
public class MeController {
    @GetMapping
    public ApiResponse<Map<String, Object>> me(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success("Thông tin access token",
                Map.of("id", user.id(), "email", user.email(), "role", user.role()));
    }
}
