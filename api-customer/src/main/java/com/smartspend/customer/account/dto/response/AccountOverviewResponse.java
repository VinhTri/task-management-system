package com.smartspend.customer.account.dto.response;

import com.smartspend.customer.wallet.dto.response.WalletResponse;

public record AccountOverviewResponse(
        boolean pinConfigured,
        String accountNumber,
        WalletResponse defaultWallet
) {
    public static AccountOverviewResponse notConfigured() {
        return new AccountOverviewResponse(false, null, null);
    }
}
