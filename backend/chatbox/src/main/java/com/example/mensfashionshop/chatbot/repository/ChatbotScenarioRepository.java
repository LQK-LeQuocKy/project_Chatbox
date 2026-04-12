package com.example.mensfashionshop.chatbot.repository;

import com.example.mensfashionshop.chatbot.entity.ChatbotScenario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatbotScenarioRepository extends JpaRepository<ChatbotScenario, Long> {
    List<ChatbotScenario> findByActiveTrue();
    Optional<ChatbotScenario> findByTitleIgnoreCase(String title);

    boolean existsByTitleIgnoreCase(String title);
}