package com.example.mensfashionshop.chatbot.entity;

import com.example.mensfashionshop.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "chat_unresolved")
public class ChatUnresolved {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_reply", columnDefinition = "TEXT")
    private String adminReply;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "replied_at")
    private LocalDateTime repliedAt;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "admin_id")
    private Long adminId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private ChatConversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_message_id", nullable = false)
    private ChatMessage customerMessage;
}