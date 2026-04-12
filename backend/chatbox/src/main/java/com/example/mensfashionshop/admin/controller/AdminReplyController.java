package com.example.mensfashionshop.admin.controller;

import com.example.mensfashionshop.admin.dto.AdminReplyConversationDetailResponse;
import com.example.mensfashionshop.admin.dto.AdminReplyConversationResponse;
import com.example.mensfashionshop.admin.dto.AdminReplyRequest;
import com.example.mensfashionshop.admin.dto.AdminReplyStatsResponse;
import com.example.mensfashionshop.admin.service.AdminReplyService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/replies")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminReplyController {

    private final AdminReplyService adminReplyService;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminReplyStatsResponse getStats() {
        return adminReplyService.getStats();
    }

    @GetMapping("/conversations")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminReplyConversationResponse> getConversations() {
        return adminReplyService.getConversationList();
    }

    @GetMapping("/conversations/{conversationId}")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminReplyConversationDetailResponse getConversationDetail(
            @PathVariable Long conversationId
    ) {
        return adminReplyService.getConversationDetail(conversationId);
    }

    @PostMapping("/conversations/{conversationId}/reply")
    @PreAuthorize("hasRole('ADMIN')")
    public String sendReply(
            @PathVariable Long conversationId,
            @RequestBody AdminReplyRequest request
    ) {
        adminReplyService.sendReply(conversationId, request.getReply());
        return "Đã gửi phản hồi thành công";
    }

    @PutMapping("/conversations/{conversationId}/done")
    @PreAuthorize("hasRole('ADMIN')")
    public String markDone(@PathVariable Long conversationId) {
        adminReplyService.markDone(conversationId);
        return "Đã đánh dấu hội thoại là DONE";
    }
}