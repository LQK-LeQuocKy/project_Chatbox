package com.example.mensfashionshop.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminChartsResponse {
    private long totalUsers;
    private long totalScripts;
    private long totalConversations;
    private long pendingConversations;

    private List<ChartItemResponse> usersByRole;
    private List<ChartItemResponse> conversationsByStatus;
    private List<ChartItemResponse> scriptsByCategory;
}