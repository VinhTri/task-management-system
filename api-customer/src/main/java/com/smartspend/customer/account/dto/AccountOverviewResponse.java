package com.smartspend.customer.account.dto;

import com.smartspend.customer.wallet.dto.WalletResponse;

public record AccountOverviewResponse(
        boolean pinConfigured,
        String accountNumber,
        WalletResponse defaultWallet
) {
    public static AccountOverviewResponse notConfigured() {
        return new AccountOverviewResponse(false, null, null);
    }
}
