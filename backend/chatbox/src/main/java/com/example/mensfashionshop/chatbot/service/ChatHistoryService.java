package com.example.mensfashionshop.chatbot.service;

import com.example.mensfashionshop.chatbot.dto.ChatHistoryMessageResponse;
import com.example.mensfashionshop.chatbot.entity.ChatConversation;
import com.example.mensfashionshop.chatbot.entity.ChatMessage;
import com.example.mensfashionshop.chatbot.repository.ChatConversationRepository;
import com.example.mensfashionshop.chatbot.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatHistoryService {

    private final ChatConversationRepository chatConversationRepository;
    private final ChatMessageRepository chatMessageRepository;

    public List<ChatHistoryMessageResponse> getMessagesBySessionCode(String sessionCode) {
        ChatConversation conversation = chatConversationRepository.findBySessionCode(sessionCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hội thoại"));

        List<ChatMessage> messages =
                chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());

        return messages.stream()
                .map(msg -> new ChatHistoryMessageResponse(
                        msg.getId(),
                        msg.getSenderType(),
                        msg.getMessage(),
                        msg.getCreatedAt()
                ))
                .toList();
    }
}