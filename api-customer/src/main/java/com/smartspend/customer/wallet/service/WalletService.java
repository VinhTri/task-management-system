package com.smartspend.customer.wallet.service;

import com.smartspend.customer.wallet.dto.response.WalletResponse;

public interface WalletService {
    WalletResponse getDefaultWallet(Long userId);
}
