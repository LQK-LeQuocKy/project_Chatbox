package com.example.mensfashionshop.admin.service;

import com.example.mensfashionshop.admin.dto.AdminChartsResponse;
import com.example.mensfashionshop.admin.dto.ChartItemResponse;
import com.example.mensfashionshop.chatbot.entity.ChatbotScenario;
import com.example.mensfashionshop.chatbot.repository.ChatUnresolvedRepository;
import com.example.mensfashionshop.chatbot.repository.ChatbotScenarioRepository;
import com.example.mensfashionshop.user.entity.Role;
import com.example.mensfashionshop.user.entity.User;
import com.example.mensfashionshop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminChartsService {

    private final UserRepository userRepository;
    private final ChatbotScenarioRepository chatbotScenarioRepository;
    private final ChatUnresolvedRepository chatUnresolvedRepository;

    public AdminChartsResponse getChartsData() {
        List<User> users = userRepository.findAll();
        List<ChatbotScenario> scenarios = chatbotScenarioRepository.findAll();

        long totalUsers = userRepository.count();
        long totalScripts = chatbotScenarioRepository.count();

        long totalConversations =
                chatUnresolvedRepository.countDistinctConversationIds();

        long pendingConversations =
                chatUnresolvedRepository.countDistinctConversationIdsByStatus("PENDING");

        List<ChartItemResponse> usersByRole = buildUsersByRole(users);
        List<ChartItemResponse> conversationsByStatus = buildConversationStatus();
        List<ChartItemResponse> scriptsByCategory = buildScriptsByCategory(scenarios);

        return new AdminChartsResponse(
                totalUsers,
                totalScripts,
                totalConversations,
                pendingConversations,
                usersByRole,
                conversationsByStatus,
                scriptsByCategory
        );
    }

    private List<ChartItemResponse> buildUsersByRole(List<User> users) {
        Map<String, Long> roleCount = new LinkedHashMap<>();

        for (User user : users) {
            String roleName = getMainRole(user);
            roleCount.merge(roleName, 1L, Long::sum);
        }

        return roleCount.entrySet().stream()
                .map(e -> new ChartItemResponse(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    private String getMainRole(User user) {
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            return "NO_ROLE";
        }

        Set<String> roleNames = user.getRoles().stream()
                .filter(Objects::nonNull)
                .map(Role::getName)
                .filter(Objects::nonNull)
                .map(Enum::name)
                .collect(Collectors.toSet());

        if (roleNames.contains("ROLE_ADMIN")) return "ROLE_ADMIN";
        if (roleNames.contains("ROLE_STAFF")) return "ROLE_STAFF";
        if (roleNames.contains("ROLE_CUSTOMER")) return "ROLE_CUSTOMER";

        return roleNames.iterator().next();
    }

    private List<ChartItemResponse> buildConversationStatus() {
        long pending = chatUnresolvedRepository.countDistinctConversationIdsByStatus("PENDING");
        long done = chatUnresolvedRepository.countDistinctConversationIdsByStatus("DONE");

        List<ChartItemResponse> result = new ArrayList<>();
        result.add(new ChartItemResponse("PENDING", pending));
        result.add(new ChartItemResponse("DONE", done));

        return result;
    }

    private List<ChartItemResponse> buildScriptsByCategory(List<ChatbotScenario> scenarios) {
        Map<String, Long> categoryCount = new LinkedHashMap<>();

        for (ChatbotScenario s : scenarios) {
            String category = resolveScenarioCategory(s);
            categoryCount.merge(category, 1L, Long::sum);
        }

        return categoryCount.entrySet().stream()
                .map(e -> new ChartItemResponse(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    private String resolveScenarioCategory(ChatbotScenario scenario) {
        if (scenario.getScopeType() != null && !scenario.getScopeType().isBlank()) {
            return scenario.getScopeType().trim();
        }

        return "GENERAL";
    }
}