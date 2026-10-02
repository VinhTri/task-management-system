package com.smartspend.customer.wallet.service.impl;

import com.smartspend.account.repository.CustomerAccountRepository;
import com.smartspend.common.exception.AppException;
import com.smartspend.customer.account.exception.AccountErrorCode;
import com.smartspend.customer.wallet.dto.WalletResponse;
import com.smartspend.customer.wallet.service.WalletService;
import com.smartspend.wallet.entity.Wallet;
import com.smartspend.wallet.repository.WalletRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WalletServiceImpl implements WalletService {
    private final CustomerAccountRepository accounts;
    private final WalletRepository wallets;

    public WalletServiceImpl(CustomerAccountRepository accounts, WalletRepository wallets) {
        this.accounts = accounts;
        this.wallets = wallets;
    }

    @Override
    @Transactional(readOnly = true)
    public WalletResponse getDefaultWallet(Long userId) {
        Long accountId = accounts.findByUserId(userId)
                .map(account -> account.getId())
                .orElseThrow(() -> new AppException(AccountErrorCode.ACCOUNT_NOT_CONFIGURED));
        Wallet wallet = wallets.findByAccountIdAndDefaultWalletTrue(accountId)
                .orElseThrow(() -> new AppException(AccountErrorCode.DEFAULT_WALLET_NOT_FOUND));
        return WalletResponse.from(wallet);
    }
}
