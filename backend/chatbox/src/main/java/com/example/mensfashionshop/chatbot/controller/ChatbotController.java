package com.example.mensfashionshop.chatbot.controller;

import com.example.mensfashionshop.chatbot.dto.ChatRequest;
import com.example.mensfashionshop.chatbot.dto.ChatResponse;
import com.example.mensfashionshop.chatbot.service.ChatbotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/send")
    public ChatResponse send(@Valid @RequestBody ChatRequest request) {
        return chatbotService.handleMessage(request);
    }
}