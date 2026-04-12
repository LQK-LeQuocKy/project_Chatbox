package com.example.mensfashionshop.chatbot.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatRequest {
    private String sessionCode;

    @NotBlank
    private String message;

    // GENERAL hoặc PRODUCT
    private String chatType;

    // null nếu là chat chung
    private Long productId;
    private String productName;
}