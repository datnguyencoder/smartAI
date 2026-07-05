package com.smartmart.repository.chat;

import com.smartmart.entity.Chat.MessageRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageReadRepository extends JpaRepository<MessageRead, Long> {

    boolean existsByMessageIdAndUserId(Long messageId, Long userId);

    List<MessageRead> findByMessageId(Long messageId);

    Long countByMessageId(Long messageId);
}
