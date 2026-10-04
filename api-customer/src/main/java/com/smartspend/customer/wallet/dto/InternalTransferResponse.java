package com.smartspend.customer.wallet.dto;

import com.smartspend.transaction.entity.WalletTransfer;

import java.math.BigDecimal;
import java.time.Instant;

public record InternalTransferResponse(
        Long id,
        String referenceCode,
        String status,
        String senderAccountNumber,
        String recipientAccountNumber,
        BigDecimal amount,
        BigDecimal balanceBefore,
        BigDecimal balanceAfter,
        String currency,
        String description,
        Instant createdAt
) {
    public static InternalTransferResponse from(WalletTransfer transfer) {
        return new InternalTransferResponse(
                transfer.getId(),
                transfer.getReferenceCode(),
                transfer.getStatus().name(),
                transfer.getSenderWallet().getAccount().getAccountNumber(),
                transfer.getRecipientWallet().getAccount().getAccountNumber(),
                transfer.getAmount(),
                transfer.getSenderBalanceBefore(),
                transfer.getSenderBalanceAfter(),
                transfer.getSenderWallet().getCurrency(),
                transfer.getDescription(),
                transfer.getCreatedAt()
        );
    }
}
