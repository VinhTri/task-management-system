package com.smartspend.auth.password.store.impl;

import com.smartspend.auth.password.store.ResetTokenStore;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.Optional;

@Repository
public class RedisResetTokenStore implements ResetTokenStore {
    private final StringRedisTemplate redis;

    public RedisResetTokenStore(StringRedisTemplate redis) { this.redis = redis; }

    @Override
    public void save(String tokenHash, String email, Duration ttl) {
        redis.opsForValue().set(key(tokenHash), email, ttl);
    }

    @Override
    public Optional<String> consume(String tokenHash) {
        return Optional.ofNullable(redis.opsForValue().getAndDelete(key(tokenHash)));
    }

    private String key(String tokenHash) {
        return "auth:password-reset:" + tokenHash;
    }
}
