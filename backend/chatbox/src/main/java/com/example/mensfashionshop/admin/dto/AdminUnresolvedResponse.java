package com.example.mensfashionshop.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUnresolvedResponse {
    private Long id;
    private Long conversationId;
    private String sessionCode;
    private String customerQuestion;
    private String status;
    private String adminReply;
    private LocalDateTime createdAt;
    private LocalDateTime repliedAt;
}