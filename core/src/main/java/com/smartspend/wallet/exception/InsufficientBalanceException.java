package com.smartspend.wallet.exception;

public class InsufficientBalanceException extends RuntimeException {
    public InsufficientBalanceException() {
        super("Số dư không đủ");
    }
}
