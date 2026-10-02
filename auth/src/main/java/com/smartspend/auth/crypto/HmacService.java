package com.smartspend.auth.crypto;

import com.smartspend.auth.config.AuthProperties;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Component
public class HmacService {
    private final SecretKeySpec key;

    public HmacService(AuthProperties properties) {
        this.key = new SecretKeySpec(properties.hmacPepper().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    public String hash(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(key);
            return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to calculate HMAC", exception);
        }
    }

    public boolean matches(String raw, String expectedHash) {
        return MessageDigest.isEqual(hash(raw).getBytes(StandardCharsets.UTF_8),
                expectedHash.getBytes(StandardCharsets.UTF_8));
    }
}
