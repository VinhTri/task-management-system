package com.smartspend.customer.wallet.dto;

import com.smartspend.wallet.entity.Wallet;

import java.math.BigDecimal;

public record WalletResponse(
        Long id,
        String accountNumber,
        String name,
        BigDecimal balance,
        String currency,
        boolean defaultWallet,
        boolean locked
) {
    public static WalletResponse from(Wallet wallet) {
        return new WalletResponse(
                wallet.getId(),
                wallet.getAccount().getAccountNumber(),
                wallet.getName(),
                wallet.getBalance(),
                wallet.getCurrency(),
                wallet.isDefaultWallet(),
                wallet.isLocked());
    }
}
