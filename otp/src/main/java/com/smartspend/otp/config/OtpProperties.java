package com.smartspend.otp.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Validated
@ConfigurationProperties(prefix = "smartspend.otp")
public record OtpProperties(
        @NotBlank String hmacPepper,
        Duration ttl,
        Duration cooldown,
        Duration progressiveCooldown,
        Duration sendWindow,
        @Min(1) int maxAttempts,
        @Min(1) int maxSendsPerWindow,
        Duration emailBlockDuration,
        Duration clientViolationWindow,
        @Min(1) int maxClientViolations,
        Duration clientBlockDuration,
        @NotBlank String mailFrom
) {
}
