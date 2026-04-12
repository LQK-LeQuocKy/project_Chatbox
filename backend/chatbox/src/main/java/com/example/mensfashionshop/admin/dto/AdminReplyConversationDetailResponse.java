package com.example.mensfashionshop.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class AdminReplyConversationDetailResponse {
    private Long conversationId;
    private String sessionCode;
    private String customerName;
    private String customerUsername;
    private String status;
    private List<AdminReplyMessageResponse> messages;
}