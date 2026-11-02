package com.smartspend.otp.service.impl;

import com.smartspend.common.exception.AppException;
import com.smartspend.otp.mail.MailGateway;
import com.smartspend.otp.config.OtpProperties;
import com.smartspend.otp.crypto.OtpHashService;
import com.smartspend.otp.exception.OtpErrorCode;
import com.smartspend.otp.model.OtpPurpose;
import com.smartspend.otp.model.OtpRecord;
import com.smartspend.otp.model.OtpStatus;
import com.smartspend.otp.service.OtpService;
import com.smartspend.otp.store.OtpStore;
import com.smartspend.otp.support.OtpGenerator;
import com.smartspend.user.EmailNormalizer;
import org.springframework.stereotype.Service;
import java.time.Duration;

@Service
public class OtpServiceImpl implements OtpService {
    private final OtpStore store;
    private final OtpGenerator generator;
    private final OtpHashService hmac;
    private final MailGateway mailGateway;
    private final OtpProperties properties;

    public OtpServiceImpl(OtpStore store, OtpGenerator generator, OtpHashService hmac,
                          MailGateway mailGateway, OtpProperties properties) {
        this.store = store;
        this.generator = generator;
        this.hmac = hmac;
        this.mailGateway = mailGateway;
        this.properties = properties;
    }

    @Override
    public Duration send(String email, OtpPurpose purpose, String ipAddress, String deviceId) {
        String identity = EmailNormalizer.normalize(email);
        Duration resendAfter = store.assertCanSend(identity, purpose, hmac.hash(ipAddress), hmac.hash(deviceId),
                properties.cooldown(), properties.progressiveCooldown(), properties.sendWindow(),
                properties.maxSendsPerWindow(), properties.emailBlockDuration(),
                properties.clientViolationWindow(), properties.maxClientViolations(),
                properties.clientBlockDuration());
        String code = generator.generate();
        store.save(identity, purpose, hmac.hash(code), properties.ttl());
        try {
            mailGateway.sendOtp(identity, code, purpose);
        } catch (RuntimeException exception) {
            store.cancel(identity, purpose);
            throw exception;
        }
        return resendAfter;
    }

    @Override
    public void verifyAndConsume(String email, String code, OtpPurpose purpose) {
        verify(email, code, purpose, OtpStatus.CONSUMED);
    }

    @Override
    public void verifyForPasswordReset(String email, String code) {
        verify(email, code, OtpPurpose.RESET_PASSWORD, OtpStatus.VERIFIED);
    }

    @Override
    public void verifyForPinReset(String email, String code) {
        verify(email, code, OtpPurpose.RESET_PIN, OtpStatus.VERIFIED);
    }

    private void verify(String email, String code, OtpPurpose purpose, OtpStatus successStatus) {
        String identity = EmailNormalizer.normalize(email);
        OtpRecord record = store.find(identity, purpose)
                .orElseThrow(() -> new AppException(OtpErrorCode.OTP_EXPIRED));
        if (record.status() != OtpStatus.PENDING) {
            throw new AppException(OtpErrorCode.INVALID_OTP);
        }
        if (record.attempts() >= properties.maxAttempts()) {
            invalidateLockedOtp(identity, purpose);
        }
        if (!hmac.matches(code, record.codeHash())) {
            long attempts = store.incrementAttempts(identity, purpose);
            if (attempts >= properties.maxAttempts()) {
                invalidateLockedOtp(identity, purpose);
            }
            throw new AppException(OtpErrorCode.INVALID_OTP);
        }
        store.updateStatus(identity, purpose, successStatus);
        store.clearSendLimits(identity, purpose);
    }

    private void invalidateLockedOtp(String identity, OtpPurpose purpose) {
        store.cancel(identity, purpose);
        long retryAfterSeconds = store.getResendWaitSeconds(identity, purpose);
        throw retryAfterSeconds > 0
                ? new AppException(OtpErrorCode.OTP_ATTEMPTS_EXCEEDED, retryAfterSeconds)
                : new AppException(OtpErrorCode.OTP_ATTEMPTS_EXCEEDED);
    }

}
