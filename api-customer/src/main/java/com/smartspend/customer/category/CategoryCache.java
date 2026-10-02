package com.smartspend.customer.category;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartspend.customer.category.dto.CategoryResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class CategoryCache {
    private static final Logger log = LoggerFactory.getLogger(CategoryCache.class);
    private static final Duration CACHE_TTL = Duration.ofMinutes(30);
    private static final Duration LOCK_TTL = Duration.ofSeconds(10);
    private static final TypeReference<List<CategoryResponse>> LIST_TYPE = new TypeReference<>() {};
    private static final DefaultRedisScript<Long> UNLOCK_SCRIPT = new DefaultRedisScript<>(
            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
            Long.class);

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    public CategoryCache(StringRedisTemplate redis, ObjectMapper objectMapper) {
        this.redis = redis;
        this.objectMapper = objectMapper;
    }

    public Optional<List<CategoryResponse>> get(Long userId) {
        try {
            String json = redis.opsForValue().get(dataKey(userId));
            return json == null ? Optional.empty() : Optional.of(objectMapper.readValue(json, LIST_TYPE));
        } catch (JsonProcessingException exception) {
            log.warn("Invalid category cache for user {}, evicting it", userId, exception);
            evict(userId);
            return Optional.empty();
        } catch (RuntimeException exception) {
            log.warn("Category cache unavailable for user {}, falling back to PostgreSQL", userId);
            return Optional.empty();
        }
    }

    public void put(Long userId, List<CategoryResponse> categories) {
        try {
            redis.opsForValue().set(dataKey(userId), objectMapper.writeValueAsString(categories), CACHE_TTL);
        } catch (JsonProcessingException exception) {
            log.warn("Could not serialize category cache for user {}", userId, exception);
        } catch (RuntimeException exception) {
            log.warn("Category cache unavailable while writing for user {}", userId);
        }
    }

    public void evict(Long userId) {
        try {
            redis.delete(dataKey(userId));
        } catch (RuntimeException exception) {
            log.warn("Category cache unavailable while evicting for user {}", userId);
        }
    }

    public Optional<String> tryLock(Long userId) {
        String token = UUID.randomUUID().toString();
        try {
            Boolean acquired = redis.opsForValue().setIfAbsent(lockKey(userId), token, LOCK_TTL);
            return Boolean.TRUE.equals(acquired) ? Optional.of(token) : Optional.empty();
        } catch (RuntimeException exception) {
            log.warn("Category cache lock unavailable for user {}", userId);
            return Optional.empty();
        }
    }

    public void unlock(Long userId, String token) {
        try {
            redis.execute(UNLOCK_SCRIPT, Collections.singletonList(lockKey(userId)), token);
        } catch (RuntimeException exception) {
            log.warn("Category cache lock could not be released for user {}", userId);
        }
    }

    private String dataKey(Long userId) { return "smartspend:category:user:" + userId + ":active:v1"; }
    private String lockKey(Long userId) { return "smartspend:lock:category:user:" + userId; }
}
