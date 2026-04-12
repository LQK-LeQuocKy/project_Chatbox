package com.example.mensfashionshop.chatbot.repository;

import com.example.mensfashionshop.chatbot.entity.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {

    Optional<ChatConversation> findBySessionCode(String sessionCode);

    long countByStartedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("""
        select count(c) from ChatConversation c
        where lower(c.status) in ('pending', 'needreply')
    """)
    long countPendingReplies();

    List<ChatConversation> findAllByOrderByStartedAtDesc();

}