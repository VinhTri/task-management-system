package com.smartspend.auth.session.store.impl;

import com.smartspend.auth.session.model.RefreshSession;
import com.smartspend.auth.session.store.RefreshSessionStore;
import com.smartspend.user.enums.Role;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Repository
public class RedisRefreshSessionStore implements RefreshSessionStore {
    private static final DefaultRedisScript<String> CONSUME_SCRIPT = new DefaultRedisScript<>("""
            local active = redis.call('GET', KEYS[2])
            if not active or active ~= ARGV[2] then return nil end
            local actual = redis.call('HGET', KEYS[1], 'secretHash')
            if not actual or actual ~= ARGV[1] then return nil end
            local userId = redis.call('HGET', KEYS[1], 'userId')
            local email = redis.call('HGET', KEYS[1], 'email')
            local role = redis.call('HGET', KEYS[1], 'role')
            redis.call('DEL', KEYS[1])
            redis.call('DEL', KEYS[2])
            return userId .. '|' .. email .. '|' .. role
            """, String.class);
    private final StringRedisTemplate redis;

    public RedisRefreshSessionStore(StringRedisTemplate redis) { this.redis = redis; }

    @Override
    public void save(RefreshSession session, Duration ttl) {
        redis.opsForHash().putAll(sessionKey(session.id()), Map.of(
                "userId", session.userId().toString(),
                "email", session.email(),
                "role", session.role().name(),
                "secretHash", session.secretHash()
        ));
        redis.expire(sessionKey(session.id()), ttl);
        redis.opsForSet().add(userSessionsKey(session.userId()), session.id());
        redis.expire(userSessionsKey(session.userId()), ttl);
        redis.opsForValue().set(activeSessionKey(session.userId()), session.id(), ttl);
    }

    @Override
    public Optional<RefreshSession> find(String sessionId) {
        Map<Object, Object> values = redis.opsForHash().entries(sessionKey(sessionId));
        if (values.isEmpty()) return Optional.empty();
        return Optional.of(new RefreshSession(sessionId,
                Long.valueOf(String.valueOf(values.get("userId"))),
                String.valueOf(values.get("email")),
                Role.valueOf(String.valueOf(values.get("role"))),
                String.valueOf(values.get("secretHash"))));
    }

    @Override
    public Optional<RefreshSession> consume(String sessionId, String presentedSecretHash) {
        Optional<RefreshSession> stored = find(sessionId);
        if (stored.isEmpty()) return Optional.empty();
        String result = redis.execute(CONSUME_SCRIPT,
                java.util.List.of(sessionKey(sessionId), activeSessionKey(stored.get().userId())),
                presentedSecretHash, sessionId);
        if (result == null) return Optional.empty();
        String[] values = result.split("\\|", 3);
        Long userId = Long.valueOf(values[0]);
        // Dọn index chính xác; session đã bị xóa atomically trong script.
        redis.opsForSet().remove(userSessionsKey(userId), sessionId);
        return Optional.of(new RefreshSession(sessionId, userId, values[1], Role.valueOf(values[2]), presentedSecretHash));
    }

    @Override
    public void delete(String sessionId) {
        find(sessionId).ifPresent(session -> {
            redis.opsForSet().remove(userSessionsKey(session.userId()), sessionId);
            String activeId = redis.opsForValue().get(activeSessionKey(session.userId()));
            if (sessionId.equals(activeId)) redis.delete(activeSessionKey(session.userId()));
        });
        redis.delete(sessionKey(sessionId));
    }

    @Override
    public void deleteAllForUser(Long userId) {
        Set<String> ids = redis.opsForSet().members(userSessionsKey(userId));
        if (ids != null && !ids.isEmpty()) redis.delete(ids.stream().map(this::sessionKey).toList());
        redis.delete(userSessionsKey(userId));
        redis.delete(activeSessionKey(userId));
    }

    @Override
    public boolean isActive(Long userId, String sessionId) {
        return sessionId != null
                && sessionId.equals(redis.opsForValue().get(activeSessionKey(userId)))
                && Boolean.TRUE.equals(redis.hasKey(sessionKey(sessionId)));
    }

    private String sessionKey(String sessionId) { return "auth:session:" + sessionId; }
    private String userSessionsKey(Long userId) { return "auth:user-sessions:" + userId; }
    private String activeSessionKey(Long userId) { return "auth:active-session:" + userId; }
}
