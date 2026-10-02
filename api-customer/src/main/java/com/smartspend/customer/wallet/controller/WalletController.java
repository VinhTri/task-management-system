package com.smartspend.customer.wallet.controller;

import com.smartspend.auth.security.AuthenticatedUser;
import com.smartspend.common.response.ApiResponse;
import com.smartspend.customer.wallet.dto.WalletResponse;
import com.smartspend.customer.wallet.service.WalletService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/wallets")
public class WalletController {
    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping("/default")
    public ApiResponse<WalletResponse> getDefaultWallet(
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success(
                "Thông tin ví mặc định",
                walletService.getDefaultWallet(user.id()));
    }
}
