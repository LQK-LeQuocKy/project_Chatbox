package com.example.mensfashionshop.admin.service;

import com.example.mensfashionshop.admin.dto.DashboardStatsResponse;
import com.example.mensfashionshop.chatbot.repository.ChatbotScenarioRepository;
import com.example.mensfashionshop.chatbot.repository.ChatUnresolvedRepository;
import com.example.mensfashionshop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final ChatbotScenarioRepository chatbotScenarioRepository;
    private final ChatUnresolvedRepository chatUnresolvedRepository;

    public DashboardStatsResponse getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalScripts = chatbotScenarioRepository.count();

        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

        long todayConversations =
                chatUnresolvedRepository.countDistinctConversationIdsToday(startOfDay, endOfDay);

        long pendingReplies =
                chatUnresolvedRepository.countDistinctConversationIdsByStatus("PENDING");

        return new DashboardStatsResponse(
                totalUsers,
                totalScripts,
                todayConversations,
                pendingReplies
        );
    }
}