package com.smartmart.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final GenericJackson2JsonRedisSerializer redisJsonSerializer;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            Object deserializedObj = redisJsonSerializer.deserialize(message.getBody());
            log.info("Redis message received. Type: {}", deserializedObj != null ? deserializedObj.getClass().getName() : "null");

            if (deserializedObj instanceof ChatEvent<?> event) {
                log.info("ChatEvent deserialized OK. type={}, conversationId={}", event.getType(), event.getConversationId());
                dispatch(event.getType() != null ? event.getType().name() : null, event.getConversationId(), event.getUserId(), event);
            } else if (deserializedObj instanceof Map<?, ?> map) {
                // Fallback: GenericJackson2JsonRedisSerializer may return a LinkedHashMap
                log.info("Deserialized as Map, converting manually. keys={}", map.keySet());
                Object type = map.get("type");
                Object convId = map.get("conversationId");
                Object userId = map.get("userId");
                Long conversationId = convId != null ? Long.valueOf(convId.toString()) : null;
                Long uid = userId != null ? Long.valueOf(userId.toString()) : null;
                dispatch(type != null ? type.toString() : null, conversationId, uid, map);
            } else {
                log.warn("Received unknown message type from Redis: {}", deserializedObj);
            }
        } catch (Exception e) {
            log.error("Failed to process message from Redis", e);
        }
    }

    private void dispatch(String type, Long conversationId, Long userId, Object payload) {
        if (conversationId != null) {
            String dest = "/topic/chat/" + conversationId;
            log.info("Sending to WebSocket destination: {}", dest);
            messagingTemplate.convertAndSend(dest, payload);
        } else if (userId != null) {
            String dest = "/topic/notifications/" + userId;
            log.info("Sending to WebSocket destination: {}", dest);
            messagingTemplate.convertAndSend(dest, payload);
        } else {
            log.warn("ChatEvent has no conversationId or userId, cannot route. type={}", type);
        }
    }
}
