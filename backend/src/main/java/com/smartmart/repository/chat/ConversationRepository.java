package com.smartmart.repository.chat;

import com.smartmart.entity.Chat.Conversation;
import com.smartmart.enums.ConversationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByIdAndStatus(Long id, ConversationStatus status);

    @Query("""
        SELECT c FROM Conversation c
        JOIN ConversationParticipant cp ON cp.conversation = c
        WHERE cp.user.id = :userId AND cp.status = 'ACTIVE'
        ORDER BY c.lastMessageAt DESC
        """)
    Page<Conversation> findMyConversations(@Param("userId") Long userId, Pageable pageable);

    @Query("""
        SELECT c FROM Conversation c
        WHERE c.type = 'PRIVATE'
          AND c.status = 'ACTIVE'
          AND (SELECT COUNT(cp) FROM ConversationParticipant cp WHERE cp.conversation = c AND cp.status = 'ACTIVE') = 2
          AND EXISTS (SELECT 1 FROM ConversationParticipant cp WHERE cp.conversation = c AND cp.user.id = :user1Id AND cp.status = 'ACTIVE')
          AND EXISTS (SELECT 1 FROM ConversationParticipant cp WHERE cp.conversation = c AND cp.user.id = :user2Id AND cp.status = 'ACTIVE')
        """)
    Optional<Conversation> findPrivateConversation(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);
}
