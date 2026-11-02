package com.smartspend.otp.store.impl;

import com.smartspend.otp.exception.OtpErrorCode;
import com.smartspend.otp.model.OtpPurpose;
import com.smartspend.otp.model.OtpRecord;
import com.smartspend.otp.model.OtpStatus;
import com.smartspend.otp.store.OtpStore;
import com.smartspend.common.exception.AppException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Repository
public class RedisOtpStore implements OtpStore {
    private static final DefaultRedisScript<Long> ASSERT_CAN_SEND_SCRIPT = new DefaultRedisScript<>("""
            local function recordClientViolation()
                local ipViolations = redis.call('INCR', KEYS[4])
                if ipViolations == 1 then redis.call('PEXPIRE', KEYS[4], ARGV[6]) end
                local deviceViolations = redis.call('INCR', KEYS[6])
                if deviceViolations == 1 then redis.call('PEXPIRE', KEYS[6], ARGV[6]) end
                if ipViolations >= tonumber(ARGV[7]) then
                    redis.call('PSETEX', KEYS[5], ARGV[8], '1')
                end
                if deviceViolations >= tonumber(ARGV[7]) then
                    redis.call('PSETEX', KEYS[7], ARGV[8], '1')
                end
            end
            if redis.call('EXISTS', KEYS[5]) == 1 or redis.call('EXISTS', KEYS[7]) == 1 then return 4 end
            if redis.call('EXISTS', KEYS[3]) == 1 then
                recordClientViolation()
                return 3
            end
            if redis.call('EXISTS', KEYS[1]) == 1 then
                recordClientViolation()
                return 1
            end
            local sends = redis.call('INCR', KEYS[2])
            if sends == 1 then redis.call('PEXPIRE', KEYS[2], ARGV[3]) end
            if sends > tonumber(ARGV[4]) then
                redis.call('PSETEX', KEYS[3], ARGV[5], '1')
                recordClientViolation()
                return 2
            end
            local cooldown = ARGV[1]
            if sends >= 2 then cooldown = ARGV[2] end
            redis.call('PSETEX', KEYS[1], cooldown, '1')
            return -tonumber(cooldown)
            """, Long.class);

    private final StringRedisTemplate redis;

    public RedisOtpStore(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    public Duration assertCanSend(String identity, OtpPurpose purpose, String ipFingerprint,
                              String deviceFingerprint, Duration cooldown, Duration progressiveCooldown,
                              Duration window, int maxSends, Duration emailBlockDuration,
                              Duration clientViolationWindow, int maxClientViolations,
                              Duration clientBlockDuration) {
        Long result = redis.execute(
                ASSERT_CAN_SEND_SCRIPT,
                List.of(cooldownKey(identity, purpose), sendCountKey(identity, purpose),
                        emailBlockKey(identity, purpose), clientViolationKey("ip", ipFingerprint),
                        clientBlockKey("ip", ipFingerprint), clientViolationKey("device", deviceFingerprint),
                        clientBlockKey("device", deviceFingerprint)),
                String.valueOf(cooldown.toMillis()),
                String.valueOf(progressiveCooldown.toMillis()),
                String.valueOf(window.toMillis()),
                String.valueOf(maxSends),
                String.valueOf(emailBlockDuration.toMillis()),
                String.valueOf(clientViolationWindow.toMillis()),
                String.valueOf(maxClientViolations),
                String.valueOf(clientBlockDuration.toMillis()));

        if (Long.valueOf(1).equals(result)) {
            throw rateLimitException(OtpErrorCode.OTP_SEND_TOO_SOON,
                    ttlSeconds(cooldownKey(identity, purpose)));
        }
        if (Long.valueOf(2).equals(result)) {
            throw rateLimitException(OtpErrorCode.OTP_SEND_LIMIT_EXCEEDED,
                    ttlSeconds(emailBlockKey(identity, purpose)));
        }
        if (Long.valueOf(3).equals(result)) {
            throw rateLimitException(OtpErrorCode.OTP_EMAIL_TEMPORARILY_BLOCKED,
                    ttlSeconds(emailBlockKey(identity, purpose)));
        }
        if (Long.valueOf(4).equals(result)) {
            long ipTtl = ttlSeconds(clientBlockKey("ip", ipFingerprint));
            long deviceTtl = ttlSeconds(clientBlockKey("device", deviceFingerprint));
            throw rateLimitException(OtpErrorCode.OTP_CLIENT_BLOCKED, Math.max(ipTtl, deviceTtl));
        }
        return Duration.ofMillis(result == null || result >= 0 ? cooldown.toMillis() : -result);
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
    public long getResendWaitSeconds(String identity, OtpPurpose purpose) {
        return Math.max(actualTtlSeconds(cooldownKey(identity, purpose)),
                actualTtlSeconds(emailBlockKey(identity, purpose)));
    }

    @Override
    public void clearSendLimits(String identity, OtpPurpose purpose) {
        redis.delete(List.of(cooldownKey(identity, purpose), sendCountKey(identity, purpose),
                emailBlockKey(identity, purpose)));
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

    private String emailBlockKey(String identity, OtpPurpose purpose) {
        return "auth:otp-email-block:" + purpose.name() + ":" + identity;
    }

    private String clientViolationKey(String type, String fingerprint) {
        return "auth:otp-client-violations:" + type + ":" + fingerprint;
    }

    private String clientBlockKey(String type, String fingerprint) {
        return "auth:otp-client-block:" + type + ":" + fingerprint;
    }

    private long ttlSeconds(String key) {
        Long ttl = redis.getExpire(key, TimeUnit.SECONDS);
        return ttl == null || ttl < 1 ? 1 : ttl;
    }

    private long actualTtlSeconds(String key) {
        Long ttl = redis.getExpire(key, TimeUnit.SECONDS);
        return ttl == null || ttl < 1 ? 0 : ttl;
    }

    private AppException rateLimitException(OtpErrorCode errorCode, long retryAfterSeconds) {
        return new AppException(errorCode, retryAfterSeconds);
    }
}
