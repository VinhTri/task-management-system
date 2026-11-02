package com.smartspend.customer.account.store;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.Optional;

@Repository
public class RedisPinResetTokenStore implements PinResetTokenStore {
    private final StringRedisTemplate redis;
    public RedisPinResetTokenStore(StringRedisTemplate redis) { this.redis = redis; }

    @Override
    public void save(String tokenHash, Long userId, Duration ttl) {
        redis.opsForValue().set(key(tokenHash), userId.toString(), ttl);
    }

    @Override
    public Optional<Long> consume(String tokenHash) {
        String value = redis.opsForValue().getAndDelete(key(tokenHash));
        return value == null ? Optional.empty() : Optional.of(Long.valueOf(value));
    }

    private String key(String tokenHash) { return "auth:pin-reset:" + tokenHash; }
}
