package com.smartspend.otp.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(OtpProperties.class)
public class OtpModuleConfiguration {
}
