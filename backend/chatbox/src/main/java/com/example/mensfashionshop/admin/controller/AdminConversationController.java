package com.example.mensfashionshop.admin.controller;

import com.example.mensfashionshop.admin.dto.AdminUnresolvedResponse;
import com.example.mensfashionshop.admin.dto.ConversationStatsResponse;
import com.example.mensfashionshop.admin.service.AdminConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/conversations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminConversationController {

    private final AdminConversationService adminConversationService;

    @GetMapping
    public List<AdminUnresolvedResponse> getConversations() {
        return adminConversationService.getConversationList();
    }

    @GetMapping("/stats")
    public ConversationStatsResponse getStats() {
        return adminConversationService.getConversationStats();
    }

    @PutMapping("/{conversationId}/toggle-status")
    public void toggleStatus(@PathVariable Long conversationId) {
        adminConversationService.toggleConversationStatus(conversationId);
    }

    @DeleteMapping("/{conversationId}")
    public void deleteConversation(@PathVariable Long conversationId) {
        adminConversationService.deleteConversationUnresolved(conversationId);
    }
}