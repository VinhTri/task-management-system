package com.smartspend.otp.store;

import com.smartspend.otp.model.OtpPurpose;
import com.smartspend.otp.model.OtpRecord;
import com.smartspend.otp.model.OtpStatus;

import java.time.Duration;
import java.util.Optional;

public interface OtpStore {
    Duration assertCanSend(String identity, OtpPurpose purpose, String ipFingerprint, String deviceFingerprint,
                       Duration cooldown, Duration progressiveCooldown, Duration window, int maxSends,
                       Duration emailBlockDuration, Duration clientViolationWindow,
                       int maxClientViolations, Duration clientBlockDuration);
    void save(String identity, OtpPurpose purpose, String codeHash, Duration ttl);
    Optional<OtpRecord> find(String identity, OtpPurpose purpose);
    long incrementAttempts(String identity, OtpPurpose purpose);
    void updateStatus(String identity, OtpPurpose purpose, OtpStatus status);
    long getResendWaitSeconds(String identity, OtpPurpose purpose);
    void clearSendLimits(String identity, OtpPurpose purpose);
    void cancel(String identity, OtpPurpose purpose);
}
