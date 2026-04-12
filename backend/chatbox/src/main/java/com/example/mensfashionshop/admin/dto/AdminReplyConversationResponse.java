package com.example.mensfashionshop.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AdminReplyConversationResponse {
    private Long conversationId;
    private String sessionCode;
    private String customerName;
    private String customerUsername;
    private String lastMessage;
    private String status;
    private LocalDateTime updatedAt;
}