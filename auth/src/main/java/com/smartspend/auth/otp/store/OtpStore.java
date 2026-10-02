package com.smartspend.auth.otp.store;

import com.smartspend.auth.otp.model.OtpPurpose;
import com.smartspend.auth.otp.model.OtpRecord;
import com.smartspend.auth.otp.model.OtpStatus;

import java.time.Duration;
import java.util.Optional;

public interface OtpStore {
    void assertCanSend(String identity, OtpPurpose purpose, Duration cooldown, Duration window, int maxSends);
    void save(String identity, OtpPurpose purpose, String codeHash, Duration ttl);
    Optional<OtpRecord> find(String identity, OtpPurpose purpose);
    long incrementAttempts(String identity, OtpPurpose purpose);
    void updateStatus(String identity, OtpPurpose purpose, OtpStatus status);
    void cancel(String identity, OtpPurpose purpose);
}

