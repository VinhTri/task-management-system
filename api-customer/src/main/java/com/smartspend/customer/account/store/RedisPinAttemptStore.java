package com.smartspend.customer.account.store;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class RedisPinAttemptStore implements PinAttemptStore {
    private static final int MAX_ATTEMPTS = 3;
    private final StringRedisTemplate redis;

    public RedisPinAttemptStore(StringRedisTemplate redis) { this.redis = redis; }

    @Override
    public long increment(Long userId) {
        String key = key(userId);
        Long attempts = redis.opsForValue().increment(key);
        return attempts == null ? MAX_ATTEMPTS : attempts;
    }

    @Override
    public long attempts(Long userId) {
        String value = redis.opsForValue().get(key(userId));
        return value == null ? 0 : Long.parseLong(value);
    }

    @Override
    public boolean isLocked(Long userId) {
        return attempts(userId) >= MAX_ATTEMPTS;
    }

    @Override public void clear(Long userId) { redis.delete(key(userId)); }
    private String key(Long userId) { return "security:transaction-pin:attempts:" + userId; }
}
