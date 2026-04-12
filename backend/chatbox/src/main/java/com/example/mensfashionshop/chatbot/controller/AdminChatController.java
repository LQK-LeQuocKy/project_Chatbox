package com.example.mensfashionshop.chatbot.controller;

import com.example.mensfashionshop.chatbot.dto.AdminReplyRequest;
import com.example.mensfashionshop.chatbot.entity.ChatMessage;
import com.example.mensfashionshop.chatbot.entity.ChatUnresolved;
import com.example.mensfashionshop.chatbot.repository.ChatMessageRepository;
import com.example.mensfashionshop.chatbot.repository.ChatUnresolvedRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminChatController {

    private final ChatUnresolvedRepository unresolvedRepository;
    private final ChatMessageRepository messageRepository;

    @GetMapping("/unresolved")
    public List<ChatUnresolved> getPendingQuestions() {
        return unresolvedRepository.findByStatusOrderByCreatedAtDesc("PENDING");
    }

    @PostMapping("/unresolved/{id}/reply")
    public String reply(@PathVariable Long id, @Valid @RequestBody AdminReplyRequest request) {
        ChatUnresolved unresolved = unresolvedRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu"));

        unresolved.setAdminReply(request.getReply());
        unresolved.setStatus("REPLIED");
        unresolved.setRepliedAt(LocalDateTime.now());
        unresolvedRepository.save(unresolved);

        ChatMessage adminMessage = new ChatMessage();
        adminMessage.setConversation(unresolved.getConversation());
        adminMessage.setSenderType("ADMIN");
        adminMessage.setSenderId(1L);
        adminMessage.setMessage(request.getReply());
        adminMessage.setCreatedAt(LocalDateTime.now());
        messageRepository.save(adminMessage);

        return "Admin đã trả lời khách hàng thành công";
    }
}