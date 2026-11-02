package com.smartspend.customer.account.store;

import java.time.Duration;
import java.util.Optional;

public interface PinResetTokenStore {
    void save(String tokenHash, Long userId, Duration ttl);
    Optional<Long> consume(String tokenHash);
}
