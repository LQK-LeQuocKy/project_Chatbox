package com.example.mensfashionshop.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class AdminConversationResponse {
    private Long id;
    private String customer;
    private String sessionCode;
    private String preview;
    private String status;
    private String chatType;
    private Long productId;
    private LocalDateTime startedAt;
}