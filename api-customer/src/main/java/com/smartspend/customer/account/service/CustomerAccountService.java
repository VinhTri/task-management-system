package com.smartspend.customer.account.service;

import com.smartspend.customer.account.dto.response.AccountOverviewResponse;
import com.smartspend.customer.account.dto.request.SetupPinRequest;
import com.smartspend.customer.account.dto.request.ResetPinRequest;
import com.smartspend.auth.dto.request.VerifyOtpRequest;
import com.smartspend.auth.dto.response.ResetTokenResponse;
import com.smartspend.customer.account.dto.response.PinStatusResponse;
import com.smartspend.customer.account.dto.response.OtpDeliveryResponse;

public interface CustomerAccountService {
    AccountOverviewResponse getOverview(Long userId);

    AccountOverviewResponse setupPin(Long userId, SetupPinRequest request);

    void verifyTransactionPin(Long userId, String rawPin);

    PinStatusResponse getPinStatus(Long userId);

    OtpDeliveryResponse requestPinReset(Long userId, String email, String ipAddress, String deviceId);

    ResetTokenResponse verifyPinResetOtp(Long userId, VerifyOtpRequest request);

    void resetPin(Long userId, ResetPinRequest request);
}
