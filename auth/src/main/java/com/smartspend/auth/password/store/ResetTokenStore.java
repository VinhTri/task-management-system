package com.smartspend.auth.password.store;

import java.time.Duration;
import java.util.Optional;

public interface ResetTokenStore {
    void save(String tokenHash, String email, Duration ttl);
    Optional<String> consume(String tokenHash);
}
