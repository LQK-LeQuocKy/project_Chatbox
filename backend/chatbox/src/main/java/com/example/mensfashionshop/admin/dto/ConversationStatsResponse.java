package com.example.mensfashionshop.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationStatsResponse {
    private long total;
    private long today;
    private long pending;
}