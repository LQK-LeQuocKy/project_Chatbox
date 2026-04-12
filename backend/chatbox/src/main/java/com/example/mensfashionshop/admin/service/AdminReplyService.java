package com.example.mensfashionshop.admin.service;

import com.example.mensfashionshop.admin.dto.AdminReplyConversationDetailResponse;
import com.example.mensfashionshop.admin.dto.AdminReplyConversationResponse;
import com.example.mensfashionshop.admin.dto.AdminReplyMessageResponse;
import com.example.mensfashionshop.admin.dto.AdminReplyRequest;
import com.example.mensfashionshop.admin.dto.AdminReplyStatsResponse;
import com.example.mensfashionshop.chatbot.entity.ChatConversation;
import com.example.mensfashionshop.chatbot.entity.ChatMessage;
import com.example.mensfashionshop.chatbot.entity.ChatUnresolved;
import com.example.mensfashionshop.chatbot.repository.ChatConversationRepository;
import com.example.mensfashionshop.chatbot.repository.ChatMessageRepository;
import com.example.mensfashionshop.chatbot.repository.ChatUnresolvedRepository;
import com.example.mensfashionshop.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminReplyService {

    private final ChatUnresolvedRepository unresolvedRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatConversationRepository conversationRepository;

    public AdminReplyStatsResponse getStats() {
        return new AdminReplyStatsResponse(
                unresolvedRepository.countByStatusIgnoreCase("PENDING"),
                unresolvedRepository.countByStatusIgnoreCase("REPLIED")
        );
    }

    public List<AdminReplyConversationResponse> getConversationList() {
        return unresolvedRepository.findLatestPerConversation()
                .stream()
                .map(this::mapToConversationResponse)
                .sorted(Comparator.comparing(
                        AdminReplyConversationResponse::getUpdatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();
    }

    public AdminReplyConversationDetailResponse getConversationDetail(Long conversationId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hội thoại"));

        List<ChatMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        List<AdminReplyMessageResponse> messageResponses = messages.stream()
                .map(this::mapToMessageResponse)
                .toList();

        User customer = conversation.getCustomer();

        List<ChatUnresolved> unresolvedItems = unresolvedRepository.findByConversationId(conversationId);

        boolean hasPending = unresolvedItems.stream()
                .anyMatch(x -> "PENDING".equalsIgnoreCase(x.getStatus()));

        String status = hasPending ? "PENDING" : "DONE";

        return new AdminReplyConversationDetailResponse(
                conversation.getId(),
                conversation.getSessionCode(),
                customer != null ? safe(customer.getFullName()) : "Khách hàng",
                customer != null ? safe(customer.getUsername()) : "",
                status,
                messageResponses
        );
    }

    @Transactional
    public void sendReply(Long conversationId, String reply) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hội thoại"));

        ChatMessage adminMessage = new ChatMessage();
        adminMessage.setConversation(conversation);
        adminMessage.setSenderType("ADMIN");
        adminMessage.setMessage(reply);
        adminMessage.setCreatedAt(LocalDateTime.now());
        messageRepository.save(adminMessage);

        List<ChatUnresolved> unresolvedItems = unresolvedRepository.findByConversationId(conversationId);

        for (ChatUnresolved item : unresolvedItems) {
            item.setAdminReply(reply);
        }

        unresolvedRepository.saveAll(unresolvedItems);
    }

    @Transactional
    public void markDone(Long conversationId) {
        List<ChatUnresolved> unresolvedItems = unresolvedRepository.findByConversationId(conversationId);

        if (unresolvedItems.isEmpty()) {
            return;
        }

        for (ChatUnresolved item : unresolvedItems) {
            item.setStatus("DONE");
            item.setRepliedAt(LocalDateTime.now());
        }

        unresolvedRepository.saveAll(unresolvedItems);

        ChatConversation conversation = unresolvedItems.get(0).getConversation();
        if (conversation != null) {
            conversation.setStatus("DONE");
            conversationRepository.save(conversation);
        }
    }

    private AdminReplyConversationResponse mapToConversationResponse(ChatUnresolved item) {
        ChatConversation conversation = item.getConversation();
        User customer = conversation != null ? conversation.getCustomer() : null;

        ChatMessage lastMessage = null;
        if (conversation != null) {
            lastMessage = messageRepository.findTopByConversationIdOrderByCreatedAtDesc(conversation.getId());
        }

        return new AdminReplyConversationResponse(
                conversation != null ? conversation.getId() : null,
                conversation != null ? safe(conversation.getSessionCode()) : "",
                customer != null ? safe(customer.getFullName()) : "Khách hàng",
                customer != null ? safe(customer.getUsername()) : "",
                lastMessage != null ? safe(lastMessage.getMessage()) : "",
                item.getStatus(),
                lastMessage != null ? lastMessage.getCreatedAt() : item.getCreatedAt()
        );
    }

    private AdminReplyMessageResponse mapToMessageResponse(ChatMessage msg) {
        String senderType = safe(msg.getSenderType()).toUpperCase();
        String senderName = resolveSenderName(senderType, msg);

        return new AdminReplyMessageResponse(
                msg.getId(),
                senderType,
                senderName,
                safe(msg.getMessage()),
                msg.getCreatedAt()
        );
    }

    private String resolveSenderName(String senderType, ChatMessage msg) {
        if ("ADMIN".equalsIgnoreCase(senderType)) {
            return "Admin";
        }
        if ("BOT".equalsIgnoreCase(senderType)) {
            return "Bot";
        }
        if ("CUSTOMER".equalsIgnoreCase(senderType) || "USER".equalsIgnoreCase(senderType)) {
            ChatConversation conversation = msg.getConversation();
            User customer = conversation != null ? conversation.getCustomer() : null;
            return customer != null ? safe(customer.getFullName()) : "Khách hàng";
        }
        return "Người gửi";
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}