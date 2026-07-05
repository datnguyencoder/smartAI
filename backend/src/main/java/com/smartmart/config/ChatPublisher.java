package com.smartmart.config;

import com.smartmart.constant.RedisChannels;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatPublisher {
    
    private final RedisTemplate<String, Object> redisTemplate;

    public void publish(ChatEvent<?> event) {
        redisTemplate.convertAndSend(RedisChannels.CHAT_EVENTS, event);
    }
}
