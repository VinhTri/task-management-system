package com.smartspend.wallet.exception;

public class InvalidWalletAmountException extends RuntimeException {
    public InvalidWalletAmountException() {
        super("Số tiền giao dịch không hợp lệ");
    }
}
