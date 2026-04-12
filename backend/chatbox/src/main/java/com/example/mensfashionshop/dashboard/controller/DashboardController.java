package com.example.mensfashionshop.dashboard.controller;

import com.example.mensfashionshop.chatbot.repository.ChatConversationRepository;
import com.example.mensfashionshop.chatbot.repository.ChatUnresolvedRepository;
import com.example.mensfashionshop.product.repository.ProductRepository;
import com.example.mensfashionshop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ChatConversationRepository conversationRepository;
    private final ChatUnresolvedRepository unresolvedRepository;

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        Map<String, Object> map = new HashMap<>();
        map.put("totalUsers", userRepository.count());
        map.put("totalProducts", productRepository.count());
        map.put("totalConversations", conversationRepository.count());
        map.put("pendingQuestions", unresolvedRepository.findByStatusOrderByCreatedAtDesc("PENDING").size());
        return map;
    }
}