package com.smartmart.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.concurrent.ConcurrentHashMap;

// JWT blacklist sau logout: bộ nhớ cục bộ + Redis (nếu có)
@Service
public class TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(TokenBlacklistService.class);
    private static final String REDIS_PREFIX = "jwt:blacklist:";

    private final StringRedisTemplate redisTemplate;
    private final ConcurrentHashMap<String, Long> memoryExpiry = new ConcurrentHashMap<>();

    public TokenBlacklistService(ObjectProvider<StringRedisTemplate> redisTemplateProvider) {
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
    }

    // Ghi token vào blacklist đến khi hết TTL
    public void blacklist(String token, long ttlMs) {
        if (token == null || token.isBlank() || ttlMs <= 0) {
            return;
        }
        String digest = hash(token);
        long expiresAt = System.currentTimeMillis() + ttlMs;
        memoryExpiry.put(digest, expiresAt);
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set(REDIS_PREFIX + digest, "1", Duration.ofMillis(ttlMs));
            } catch (Exception ex) {
                log.warn("Could not blacklist token in Redis: {}", ex.getMessage());
            }
        }
    }

    // Kiểm tra token đã logout / bị thu hồi
    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        purgeExpired();
        String digest = hash(token);
        Long expiresAt = memoryExpiry.get(digest);
        if (expiresAt != null && expiresAt > System.currentTimeMillis()) {
            return true;
        }
        if (redisTemplate != null) {
            try {
                return Boolean.TRUE.equals(redisTemplate.hasKey(REDIS_PREFIX + digest));
            } catch (Exception ex) {
                log.debug("Redis blacklist check skipped: {}", ex.getMessage());
            }
        }
        return false;
    }

    private void purgeExpired() {
        long now = System.currentTimeMillis();
        memoryExpiry.entrySet().removeIf(e -> e.getValue() <= now);
    }

    private static String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            return Integer.toHexString(token.hashCode());
        }
    }
}
