package com.example.mensfashionshop.admin.service;

import com.example.mensfashionshop.admin.dto.AdminUnresolvedResponse;
import com.example.mensfashionshop.admin.dto.ConversationStatsResponse;
import com.example.mensfashionshop.chatbot.entity.ChatConversation;
import com.example.mensfashionshop.chatbot.entity.ChatMessage;
import com.example.mensfashionshop.chatbot.entity.ChatUnresolved;
import com.example.mensfashionshop.chatbot.repository.ChatUnresolvedRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminConversationService {

    private final ChatUnresolvedRepository chatUnresolvedRepository;

    public ConversationStatsResponse getConversationStats() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        long total = chatUnresolvedRepository.countDistinctConversationIds();
        long todayCount = chatUnresolvedRepository.countDistinctConversationIdsToday(start, end);
        long pending = chatUnresolvedRepository.countDistinctConversationIdsByStatus("PENDING");

        return new ConversationStatsResponse(total, todayCount, pending);
    }

    public List<AdminUnresolvedResponse> getConversationList() {
        List<ChatUnresolved> items = chatUnresolvedRepository.findLatestPerConversation();

        return items.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public void toggleConversationStatus(Long conversationId) {
        List<ChatUnresolved> items = chatUnresolvedRepository.findByConversationId(conversationId);

        if (items.isEmpty()) {
            return;
        }

        boolean hasPending = items.stream()
                .anyMatch(x -> "PENDING".equalsIgnoreCase(x.getStatus()));

        String newStatus = hasPending ? "DONE" : "PENDING";

        for (ChatUnresolved item : items) {
            item.setStatus(newStatus);

            if ("DONE".equalsIgnoreCase(newStatus)) {
                item.setRepliedAt(LocalDateTime.now());
            } else {
                item.setRepliedAt(null);
            }
        }

        chatUnresolvedRepository.saveAll(items);
    }

    @Transactional
    public void deleteConversationUnresolved(Long conversationId) {
        List<ChatUnresolved> items = chatUnresolvedRepository.findByConversationId(conversationId);
        if (!items.isEmpty()) {
            chatUnresolvedRepository.deleteAll(items);
        }
    }

    private AdminUnresolvedResponse mapToResponse(ChatUnresolved unresolved) {
        ChatConversation conversation = unresolved.getConversation();
        ChatMessage customerMessage = unresolved.getCustomerMessage();

        String question = customerMessage != null ? customerMessage.getMessage() : "";
        String sessionCode = conversation != null ? conversation.getSessionCode() : "";

        return new AdminUnresolvedResponse(
                unresolved.getId(),
                conversation != null ? conversation.getId() : null,
                sessionCode,
                question,
                unresolved.getStatus(),
                unresolved.getAdminReply(),
                unresolved.getCreatedAt(),
                unresolved.getRepliedAt()
        );
    }
}