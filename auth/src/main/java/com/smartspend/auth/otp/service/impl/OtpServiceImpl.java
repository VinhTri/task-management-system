package com.smartspend.auth.otp.service.impl;

import com.smartspend.common.exception.AppException;
import com.smartspend.auth.config.AuthProperties;
import com.smartspend.auth.crypto.HmacService;
import com.smartspend.auth.exception.AuthErrorCode;
import com.smartspend.auth.mail.MailGateway;
import com.smartspend.auth.otp.model.OtpPurpose;
import com.smartspend.auth.otp.model.OtpRecord;
import com.smartspend.auth.otp.model.OtpStatus;
import com.smartspend.auth.otp.service.OtpService;
import com.smartspend.auth.otp.store.OtpStore;
import com.smartspend.auth.otp.support.OtpGenerator;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class OtpServiceImpl implements OtpService {
    private final OtpStore store;
    private final OtpGenerator generator;
    private final HmacService hmac;
    private final MailGateway mailGateway;
    private final AuthProperties properties;

    public OtpServiceImpl(OtpStore store, OtpGenerator generator, HmacService hmac,
                          MailGateway mailGateway, AuthProperties properties) {
        this.store = store;
        this.generator = generator;
        this.hmac = hmac;
        this.mailGateway = mailGateway;
        this.properties = properties;
    }

    @Override
    public void send(String email, OtpPurpose purpose) {
        String identity = normalize(email);
        store.assertCanSend(identity, purpose, properties.otpCooldown(), properties.otpSendWindow(),
                properties.otpMaxSendsPerWindow());
        String code = generator.generate();
        store.save(identity, purpose, hmac.hash(code), properties.otpTtl());
        try {
            mailGateway.sendOtp(identity, code, purpose);
        } catch (RuntimeException exception) {
            store.cancel(identity, purpose);
            throw exception;
        }
    }

    @Override
    public void verifyAndConsume(String email, String code, OtpPurpose purpose) {
        verify(email, code, purpose, OtpStatus.CONSUMED);
    }

    @Override
    public void verifyForPasswordReset(String email, String code) {
        verify(email, code, OtpPurpose.RESET_PASSWORD, OtpStatus.VERIFIED);
    }

    private void verify(String email, String code, OtpPurpose purpose, OtpStatus successStatus) {
        String identity = normalize(email);
        OtpRecord record = store.find(identity, purpose)
                .orElseThrow(() -> new AppException(AuthErrorCode.OTP_EXPIRED));
        if (record.status() != OtpStatus.PENDING) {
            throw new AppException(AuthErrorCode.INVALID_OTP);
        }
        if (record.attempts() >= properties.otpMaxAttempts()) {
            throw new AppException(AuthErrorCode.OTP_ATTEMPTS_EXCEEDED);
        }
        if (!hmac.matches(code, record.codeHash())) {
            long attempts = store.incrementAttempts(identity, purpose);
            if (attempts >= properties.otpMaxAttempts()) {
                throw new AppException(AuthErrorCode.OTP_ATTEMPTS_EXCEEDED);
            }
            throw new AppException(AuthErrorCode.INVALID_OTP);
        }
        store.updateStatus(identity, purpose, successStatus);
    }

    private String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
