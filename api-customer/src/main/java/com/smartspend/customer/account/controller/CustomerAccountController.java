package com.smartspend.customer.account.controller;

import com.smartspend.auth.security.AuthenticatedUser;
import com.smartspend.customer.account.dto.response.AccountOverviewResponse;
import com.smartspend.customer.account.dto.response.PinStatusResponse;
import com.smartspend.customer.account.dto.response.OtpDeliveryResponse;
import com.smartspend.customer.account.dto.request.SetupPinRequest;
import com.smartspend.customer.account.dto.request.ResetPinRequest;
import com.smartspend.auth.dto.request.SendOtpRequest;
import com.smartspend.auth.dto.request.VerifyOtpRequest;
import com.smartspend.auth.dto.response.ResetTokenResponse;
import com.smartspend.customer.account.service.CustomerAccountService;
import com.smartspend.common.response.ApiResponse;
import com.smartspend.customer.common.web.ClientIdentity;
import com.smartspend.customer.common.web.ClientIdentityResolver;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/account")
public class CustomerAccountController {
    private final CustomerAccountService accountService;
    private final ClientIdentityResolver clientIdentityResolver;

    public CustomerAccountController(CustomerAccountService accountService,
                                     ClientIdentityResolver clientIdentityResolver) {
        this.accountService = accountService;
        this.clientIdentityResolver = clientIdentityResolver;
    }

    @GetMapping
    public ApiResponse<AccountOverviewResponse> overview(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success("Thông tin tài khoản", accountService.getOverview(user.id()));
    }

    @GetMapping("/pin/status")
    public ApiResponse<PinStatusResponse> pinStatus(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success("Trạng thái mã PIN", accountService.getPinStatus(user.id()));
    }

    @PostMapping("/setup-pin")
    public ApiResponse<AccountOverviewResponse> setupPin(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody SetupPinRequest request) {
        return ApiResponse.success("Thiết lập mã PIN và tạo ví mặc định thành công",
                accountService.setupPin(user.id(), request));
    }

    @PostMapping("/pin/forgot")
    public ApiResponse<OtpDeliveryResponse> forgotPin(@AuthenticationPrincipal AuthenticatedUser user,
                                      @Valid @RequestBody SendOtpRequest request,
                                      HttpServletRequest servletRequest) {
        ClientIdentity client = clientIdentityResolver.resolve(servletRequest);
        return ApiResponse.success("OTP đặt lại PIN đã được gửi đến email",
                accountService.requestPinReset(user.id(), request.email(), client.ipAddress(), client.deviceId()));
    }

    @PostMapping("/pin/verify-otp")
    public ApiResponse<ResetTokenResponse> verifyPinOtp(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody VerifyOtpRequest request) {
        return ApiResponse.success("OTP hợp lệ", accountService.verifyPinResetOtp(user.id(), request));
    }

    @PostMapping("/pin/reset")
    public ApiResponse<Void> resetPin(@AuthenticationPrincipal AuthenticatedUser user,
                                     @Valid @RequestBody ResetPinRequest request) {
        accountService.resetPin(user.id(), request);
        return ApiResponse.success("Đặt lại mã PIN thành công");
    }
}
