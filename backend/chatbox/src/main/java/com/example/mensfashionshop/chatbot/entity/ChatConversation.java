package com.example.mensfashionshop.chatbot.entity;

import com.example.mensfashionshop.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "chat_conversations")
public class ChatConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private User customer;

    @Column(name = "session_code", nullable = false, unique = true, length = 100)
    private String sessionCode;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "chat_type", nullable = false, length = 20)
    private String chatType;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "last_product_keyword", length = 100)
    private String lastProductKeyword;

    @Column(name = "last_product_offset")
    private Integer lastProductOffset;
}