package com.smartspend.customer.account.service;

import com.smartspend.customer.account.dto.AccountOverviewResponse;
import com.smartspend.customer.account.dto.SetupPinRequest;

public interface CustomerAccountService {
    AccountOverviewResponse getOverview(Long userId);

    AccountOverviewResponse setupPin(Long userId, SetupPinRequest request);

    void verifyTransactionPin(Long userId, String rawPin);
}
