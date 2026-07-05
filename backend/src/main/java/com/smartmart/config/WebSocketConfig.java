package com.smartmart.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.context.annotation.Lazy;
import com.smartmart.security.JwtTokenProvider;
import com.smartmart.repository.UserRepository;
import com.smartmart.repository.chat.ConversationParticipantRepository;
import com.smartmart.enums.ParticipantStatus;
import com.smartmart.entity.User;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final ConversationParticipantRepository participantRepository;

    public WebSocketConfig(@Lazy JwtTokenProvider jwtTokenProvider,
                           @Lazy UserRepository userRepository,
                           @Lazy ConversationParticipantRepository participantRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.participantRepository = participantRepository;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }

    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
                
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        if (jwtTokenProvider.validateToken(token)) {
                            String username = jwtTokenProvider.getUsernameFromJwt(token);
                            User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new AccessDeniedException("User not found"));
                            accessor.getSessionAttributes().put("userId", user.getId());
                        } else {
                            throw new AccessDeniedException("Invalid JWT Token");
                        }
                    } else {
                        throw new AccessDeniedException("Missing JWT Token");
                    }
                } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    String destination = accessor.getDestination();
                    Long userId = (Long) accessor.getSessionAttributes().get("userId");
                    
                    if (userId == null) {
                        throw new AccessDeniedException("User not authenticated for subscribe");
                    }
                    
                    if (destination != null && destination.startsWith("/topic/chat/")) {
                        try {
                            Long conversationId = Long.parseLong(destination.substring("/topic/chat/".length()));
                            boolean isMember = participantRepository.existsByConversationIdAndUserIdAndStatus(
                                conversationId, userId, ParticipantStatus.ACTIVE);
                            if (!isMember) {
                                throw new AccessDeniedException("User is not a participant of this conversation");
                            }
                        } catch (NumberFormatException e) {
                            throw new AccessDeniedException("Invalid conversation ID");
                        }
                    } else if (destination != null && destination.startsWith("/topic/notifications/")) {
                        try {
                            Long destUserId = Long.parseLong(destination.substring("/topic/notifications/".length()));
                            if (!destUserId.equals(userId)) {
                                throw new AccessDeniedException("Cannot subscribe to other user's notifications");
                            }
                        } catch (NumberFormatException e) {
                            throw new AccessDeniedException("Invalid user ID");
                        }
                    }
                }
                
                return message;
            }
        });
    }
}
