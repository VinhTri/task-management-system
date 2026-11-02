package com.smartspend.wallet.exception;

public class WalletBalanceLimitExceededException extends RuntimeException {
    public WalletBalanceLimitExceededException() {
        super("Số dư ví không được vượt quá 3.000.000.000 VND");
    }
}
