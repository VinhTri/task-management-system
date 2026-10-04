package com.smartspend.customer.wallet.controller;

import com.smartspend.auth.security.AuthenticatedUser;
import com.smartspend.common.response.ApiResponse;
import com.smartspend.customer.wallet.dto.WalletOperationRequest;
import com.smartspend.customer.wallet.dto.WalletTransactionResponse;
import com.smartspend.customer.wallet.dto.InternalTransferRequest;
import com.smartspend.customer.wallet.dto.InternalTransferResponse;
import com.smartspend.customer.wallet.service.WalletTransactionService;
import com.smartspend.transaction.enums.TransactionType;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/wallets/default")
public class WalletTransactionController {
    private static final int MAX_PAGE_SIZE = 100;

    private final WalletTransactionService service;

    public WalletTransactionController(WalletTransactionService service) {
        this.service = service;
    }

    @PostMapping("/deposits")
    public ApiResponse<WalletTransactionResponse> deposit(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody WalletOperationRequest request) {
        return ApiResponse.success(
                "Nạp tiền thành công",
                service.deposit(user.id(), idempotencyKey, request));
    }

    @PostMapping("/withdrawals")
    public ApiResponse<WalletTransactionResponse> withdraw(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody WalletOperationRequest request) {
        return ApiResponse.success(
                "Rút tiền thành công",
                service.withdraw(user.id(), idempotencyKey, request));
    }

    @PostMapping("/transfers")
    public ApiResponse<InternalTransferResponse> transfer(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody InternalTransferRequest request) {
        return ApiResponse.success(
                "Chuyển tiền thành công",
                service.transfer(user.id(), idempotencyKey, request));
    }

    @GetMapping("/transactions")
    public ApiResponse<Page<WalletTransactionResponse>> getTransactions(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(
                safePage,
                safeSize,
                Sort.by(Sort.Direction.DESC, "createdAt"));

        return ApiResponse.success(
                "Lịch sử giao dịch",
                service.getTransactions(user.id(), type, pageable));
    }
}
