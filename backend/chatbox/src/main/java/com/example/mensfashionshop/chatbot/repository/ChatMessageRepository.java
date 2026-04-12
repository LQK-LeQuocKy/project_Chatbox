package com.example.mensfashionshop.chatbot.repository;

import com.example.mensfashionshop.chatbot.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
    List<ChatMessage> findByConversationId(Long conversationId);
    Optional<ChatMessage> findFirstByConversationIdOrderByCreatedAtDesc(Long conversationId);
    ChatMessage findTopByConversationIdOrderByCreatedAtDesc(Long conversationId);
}