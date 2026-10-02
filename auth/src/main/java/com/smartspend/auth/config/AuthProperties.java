package com.smartspend.auth.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Validated
@ConfigurationProperties(prefix = "smartspend.auth")
public record AuthProperties(
        @NotBlank String jwtSecretBase64,
        @NotBlank String hmacPepper,
        Duration accessTokenTtl,
        Duration refreshTokenTtl,
        Duration otpTtl,
        Duration otpCooldown,
        Duration otpSendWindow,
        @Min(1) int otpMaxAttempts,
        @Min(1) int otpMaxSendsPerWindow,
        Duration resetTokenTtl,
        String mailFrom
) {
}
