package com.smartmart.service.impl;

import com.smartmart.service.ReadService;

import com.smartmart.dto.response.SeenUserResponse;
import com.smartmart.entity.Chat.Message;
import com.smartmart.entity.Chat.MessageRead;
import com.smartmart.entity.User;
import com.smartmart.exception.ErrorCode;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.UserRepository;
import com.smartmart.repository.chat.MessageReadRepository;
import com.smartmart.repository.chat.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReadServiceImpl implements ReadService {

    private final MessageReadRepository messageReadRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void markAsRead(Long messageId, Long currentUserId) {
        if (!messageReadRepository.existsByMessageIdAndUserId(messageId, currentUserId)) {
            Message msg = messageRepository.findByIdAndDeletedAtIsNull(messageId)
                    .orElseThrow(() -> new NotFoundException(ErrorCode.NOT_FOUND, "Tin nhắn không tồn tại"));
            User user = userRepository.findById(currentUserId).orElseThrow();

            MessageRead mr = MessageRead.builder()
                    .message(msg)
                    .user(user)
                    .readAt(LocalDateTime.now())
                    .build();
            
            messageReadRepository.save(mr);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<SeenUserResponse> getSeenUsers(Long messageId) {
        return messageReadRepository.findByMessageId(messageId).stream()
                .map(mr -> SeenUserResponse.builder()
                        .userId(mr.getUser().getId())
                        .username(mr.getUser().getUsername())
                        .fullName(mr.getUser().getFullName())
                        .readAt(mr.getReadAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long getSeenCount(Long messageId) {
        return messageReadRepository.countByMessageId(messageId);
    }
}
