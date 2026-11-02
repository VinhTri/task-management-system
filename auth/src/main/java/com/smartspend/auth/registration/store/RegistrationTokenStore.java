package com.smartspend.auth.registration.store;

import java.time.Duration;
import java.util.Optional;

public interface RegistrationTokenStore {
    void save(String tokenHash, String email, Duration ttl);
    Optional<String> consume(String tokenHash);
}
