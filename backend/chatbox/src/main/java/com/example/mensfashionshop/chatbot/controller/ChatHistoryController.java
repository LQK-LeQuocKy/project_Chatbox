package com.example.mensfashionshop.chatbot.controller;

import com.example.mensfashionshop.chatbot.dto.ChatHistoryMessageResponse;
import com.example.mensfashionshop.chatbot.entity.ChatConversation;
import com.example.mensfashionshop.chatbot.repository.ChatConversationRepository;
import com.example.mensfashionshop.chatbot.repository.ChatMessageRepository;
import com.example.mensfashionshop.chatbot.service.ChatHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatHistoryController {

    private final ChatHistoryService chatHistoryService;
    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;

    @GetMapping("/history/{sessionCode}")
    public List<ChatHistoryMessageResponse> getHistory(@PathVariable String sessionCode) {
        ChatConversation conversation = conversationRepository.findBySessionCode(sessionCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hội thoại"));

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId())
                .stream()
                .map(msg -> new ChatHistoryMessageResponse(
                        msg.getId(),
                        msg.getSenderType(),
                        msg.getMessage(),
                        msg.getCreatedAt()
                ))
                .toList();
    }
}