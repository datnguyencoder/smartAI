package com.smartmart.repository.chat;

import com.smartmart.entity.Chat.ConversationParticipant;
import com.smartmart.enums.ParticipantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, Long> {

    Optional<ConversationParticipant> findByConversationIdAndUserId(Long conversationId, Long userId);

    boolean existsByConversationIdAndUserIdAndStatus(Long conversationId, Long userId, ParticipantStatus status);

    List<ConversationParticipant> findByConversationIdAndStatus(Long conversationId, ParticipantStatus status);

    List<ConversationParticipant> findByUserIdAndStatus(Long userId, ParticipantStatus status);
}
