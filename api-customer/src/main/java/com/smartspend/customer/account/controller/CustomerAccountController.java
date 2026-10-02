package com.smartspend.customer.account.controller;

import com.smartspend.auth.security.AuthenticatedUser;
import com.smartspend.customer.account.dto.AccountOverviewResponse;
import com.smartspend.customer.account.dto.SetupPinRequest;
import com.smartspend.customer.account.service.CustomerAccountService;
import com.smartspend.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/account")
public class CustomerAccountController {
    private final CustomerAccountService accountService;

    public CustomerAccountController(CustomerAccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public ApiResponse<AccountOverviewResponse> overview(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success("Thông tin tài khoản", accountService.getOverview(user.id()));
    }

    @PostMapping("/setup-pin")
    public ApiResponse<AccountOverviewResponse> setupPin(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody SetupPinRequest request) {
        return ApiResponse.success("Thiết lập mã PIN và tạo ví mặc định thành công",
                accountService.setupPin(user.id(), request));
    }
}
