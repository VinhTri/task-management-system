package com.smartspend.customer.wallet.service;

import com.smartspend.customer.wallet.dto.WalletOperationRequest;
import com.smartspend.customer.wallet.dto.WalletTransactionResponse;
import com.smartspend.customer.wallet.dto.InternalTransferRequest;
import com.smartspend.customer.wallet.dto.InternalTransferResponse;
import com.smartspend.transaction.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface WalletTransactionService {
    WalletTransactionResponse deposit(Long userId, String idempotencyKey, WalletOperationRequest request);

    WalletTransactionResponse withdraw(Long userId, String idempotencyKey, WalletOperationRequest request);

    InternalTransferResponse transfer(Long userId, String idempotencyKey, InternalTransferRequest request);

    Page<WalletTransactionResponse> getTransactions(Long userId, TransactionType type, Pageable pageable);
}
