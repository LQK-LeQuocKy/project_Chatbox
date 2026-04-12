package com.example.mensfashionshop.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class AdminConversationStatsResponse {
    private long total;
    private long today;
    private long pending;
}