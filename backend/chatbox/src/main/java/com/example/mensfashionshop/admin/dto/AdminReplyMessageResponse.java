package com.example.mensfashionshop.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AdminReplyMessageResponse {
    private Long id;
    private String senderType;
    private String senderName;
    private String message;
    private LocalDateTime sentAt;
}