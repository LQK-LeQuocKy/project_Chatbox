package com.example.mensfashionshop.chatbot.controller;

import com.example.mensfashionshop.chatbot.dto.ChatbotScenarioRequest;
import com.example.mensfashionshop.chatbot.dto.ScenarioSaveResponse;
import com.example.mensfashionshop.chatbot.entity.ChatbotScenario;
import com.example.mensfashionshop.chatbot.repository.ChatbotScenarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/chatbot-scenarios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatbotScenarioAdminController {

    private final ChatbotScenarioRepository repository;

    @GetMapping
    public List<ChatbotScenario> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<ScenarioSaveResponse> create(@RequestBody ChatbotScenarioRequest request) {
        String title = request.getTitle() == null ? "" : request.getTitle().trim();

        if (title.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ScenarioSaveResponse(false, false, "Tiêu đề không được để trống", null));
        }

        Optional<ChatbotScenario> existingOpt = repository.findByTitleIgnoreCase(title);

        if (existingOpt.isPresent() && !Boolean.TRUE.equals(request.getOverwrite())) {
            return ResponseEntity.ok(
                    new ScenarioSaveResponse(
                            false,
                            true,
                            "Kịch bản này đã có rồi. Bạn có muốn thêm này vào không?",
                            existingOpt.get().getId()
                    )
            );
        }

        if (existingOpt.isPresent() && Boolean.TRUE.equals(request.getOverwrite())) {
            repository.delete(existingOpt.get());
        }

        ChatbotScenario scenario = new ChatbotScenario();
        scenario.setTitle(title);
        scenario.setQuestionPattern(request.getQuestionPattern());
        scenario.setKeywords(request.getKeywords());
        scenario.setAnswer(request.getAnswer());
        scenario.setScenarioType(defaultIfBlank(request.getScenarioType(), "TEXT"));
        scenario.setScopeType(defaultIfBlank(request.getScopeType(), "GENERAL"));
        scenario.setActive(request.getActive() == null || request.getActive());

        ChatbotScenario saved = repository.save(scenario);

        return ResponseEntity.ok(
                new ScenarioSaveResponse(true, false, "Lưu kịch bản thành công", saved.getId())
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScenarioSaveResponse> update(@PathVariable Long id,
                                                       @RequestBody ChatbotScenarioRequest request) {
        Optional<ChatbotScenario> currentOpt = repository.findById(id);

        if (currentOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ScenarioSaveResponse(false, false, "Không tìm thấy kịch bản", null));
        }

        ChatbotScenario current = currentOpt.get();
        String newTitle = request.getTitle() == null ? "" : request.getTitle().trim();

        if (newTitle.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ScenarioSaveResponse(false, false, "Tiêu đề không được để trống", null));
        }

        Optional<ChatbotScenario> duplicatedOpt = repository.findByTitleIgnoreCase(newTitle);

        if (duplicatedOpt.isPresent() && !duplicatedOpt.get().getId().equals(id)) {
            if (!Boolean.TRUE.equals(request.getOverwrite())) {
                return ResponseEntity.ok(
                        new ScenarioSaveResponse(
                                false,
                                true,
                                "Kịch bản này đã có rồi. Bạn có muốn thêm này vào không?",
                                duplicatedOpt.get().getId()
                        )
                );
            } else {
                repository.delete(duplicatedOpt.get());
            }
        }

        current.setTitle(newTitle);
        current.setQuestionPattern(request.getQuestionPattern());
        current.setKeywords(request.getKeywords());
        current.setAnswer(request.getAnswer());
        current.setScenarioType(defaultIfBlank(request.getScenarioType(), "TEXT"));
        current.setScopeType(defaultIfBlank(request.getScopeType(), "GENERAL"));
        current.setActive(request.getActive() == null || request.getActive());

        ChatbotScenario saved = repository.save(current);

        return ResponseEntity.ok(
                new ScenarioSaveResponse(true, false, "Cập nhật kịch bản thành công", saved.getId())
        );
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }

    private String defaultIfBlank(String value, String defaultValue) {
        return (value == null || value.trim().isEmpty()) ? defaultValue : value.trim();
    }
}