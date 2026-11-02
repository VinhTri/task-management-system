package com.smartspend.customer.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class AvatarResourceConfiguration implements WebMvcConfigurer {
    private final String avatarDirectory;

    public AvatarResourceConfiguration(
            @Value("${smartspend.storage.avatar-directory:./data/avatars}") String avatarDirectory) {
        this.avatarDirectory = avatarDirectory;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Path.of(avatarDirectory).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/avatars/**").addResourceLocations(location);
    }
}
