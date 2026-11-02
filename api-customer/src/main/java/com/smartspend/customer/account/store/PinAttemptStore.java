package com.smartspend.customer.account.store;

public interface PinAttemptStore {
    long increment(Long userId);
    long attempts(Long userId);
    boolean isLocked(Long userId);
    void clear(Long userId);
}
