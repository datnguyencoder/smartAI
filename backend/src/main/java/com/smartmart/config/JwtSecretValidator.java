package com.smartmart.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
public class JwtSecretValidator {

    private static final int MIN_BYTES = 32;

    @Value("${app.jwt.secret}")
    private String secret;

    @PostConstruct
    void validate() {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < MIN_BYTES) {
            throw new IllegalStateException(
                    "app.jwt.secret phải >= " + MIN_BYTES + " bytes (256-bit) cho HS256"
            );
        }
    }
}
