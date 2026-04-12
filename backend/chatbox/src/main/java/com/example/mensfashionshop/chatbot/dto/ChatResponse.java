package com.example.mensfashionshop.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private String sender;
    private String message;
    private boolean fallback;
    private String responseType;
    private List<?> products;
    private Map<String, Object> metadata;
    private String sessionCode;
}