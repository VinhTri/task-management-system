package com.smartspend.auth.session.store;

import com.smartspend.auth.session.model.RefreshSession;

import java.time.Duration;
import java.util.Optional;

public interface RefreshSessionStore {
    void save(RefreshSession session, Duration ttl);
    Optional<RefreshSession> find(String sessionId);
    Optional<RefreshSession> consume(String sessionId, String presentedSecretHash);
    void delete(String sessionId);
    void deleteAllForUser(Long userId);
}
