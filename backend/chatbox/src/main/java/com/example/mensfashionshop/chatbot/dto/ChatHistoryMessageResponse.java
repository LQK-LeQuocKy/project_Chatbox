package com.example.mensfashionshop.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ChatHistoryMessageResponse {
    private Long id;
    private String senderType;
    private String message;
    private LocalDateTime createdAt;
}