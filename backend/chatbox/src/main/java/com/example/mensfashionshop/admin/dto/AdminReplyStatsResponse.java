package com.example.mensfashionshop.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminReplyStatsResponse {
    private long pendingCount;
    private long repliedCount;
}