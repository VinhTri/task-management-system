package com.smartspend.auth.otp.store.impl;

import com.smartspend.auth.exception.AuthErrorCode;
import com.smartspend.auth.otp.model.OtpPurpose;
import com.smartspend.auth.otp.model.OtpRecord;
import com.smartspend.auth.otp.model.OtpStatus;
import com.smartspend.auth.otp.store.OtpStore;
import com.smartspend.common.exception.AppException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class RedisOtpStore implements OtpStore {
    private static final DefaultRedisScript<Long> ASSERT_CAN_SEND_SCRIPT = new DefaultRedisScript<>("""
            if redis.call('EXISTS', KEYS[1]) == 1 then return 1 end
            local sends = redis.call('INCR', KEYS[2])
            if sends == 1 then redis.call('PEXPIRE', KEYS[2], ARGV[2]) end
            if sends > tonumber(ARGV[3]) then return 2 end
            redis.call('PSETEX', KEYS[1], ARGV[1], '1')
            return 0
            """, Long.class);

    private final StringRedisTemplate redis;

    public RedisOtpStore(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    public void assertCanSend(String identity, OtpPurpose purpose, Duration cooldown,
                              Duration window, int maxSends) {
        Long result = redis.execute(
                ASSERT_CAN_SEND_SCRIPT,
                List.of(cooldownKey(identity, purpose), sendCountKey(identity, purpose)),
                String.valueOf(cooldown.toMillis()),
                String.valueOf(window.toMillis()),
                String.valueOf(maxSends));

        if (Long.valueOf(1).equals(result)) {
            throw new AppException(AuthErrorCode.OTP_SEND_TOO_SOON);
        }
        if (Long.valueOf(2).equals(result)) {
            throw new AppException(AuthErrorCode.OTP_SEND_LIMIT_EXCEEDED);
        }
    }

    @Override
    public void save(String identity, OtpPurpose purpose, String codeHash, Duration ttl) {
        String key = otpKey(identity, purpose);
        redis.opsForHash().putAll(key, Map.of(
                "codeHash", codeHash,
                "status", OtpStatus.PENDING.name(),
                "attempts", "0"));
        redis.expire(key, ttl);
    }

    @Override
    public Optional<OtpRecord> find(String identity, OtpPurpose purpose) {
        Map<Object, Object> values = redis.opsForHash().entries(otpKey(identity, purpose));
        if (values.isEmpty()) return Optional.empty();
        return Optional.of(new OtpRecord(
                String.valueOf(values.get("codeHash")),
                OtpStatus.valueOf(String.valueOf(values.get("status"))),
                Long.parseLong(String.valueOf(values.get("attempts")))));
    }

    @Override
    public long incrementAttempts(String identity, OtpPurpose purpose) {
        return redis.opsForHash().increment(otpKey(identity, purpose), "attempts", 1);
    }

    @Override
    public void updateStatus(String identity, OtpPurpose purpose, OtpStatus status) {
        redis.opsForHash().put(otpKey(identity, purpose), "status", status.name());
    }

    @Override
    public void cancel(String identity, OtpPurpose purpose) {
        redis.delete(otpKey(identity, purpose));
    }

    private String otpKey(String identity, OtpPurpose purpose) {
        return "auth:otp:" + purpose.name() + ":" + identity;
    }

    private String cooldownKey(String identity, OtpPurpose purpose) {
        return "auth:otp-cooldown:" + purpose.name() + ":" + identity;
    }

    private String sendCountKey(String identity, OtpPurpose purpose) {
        return "auth:otp-sends:" + purpose.name() + ":" + identity;
    }
}
