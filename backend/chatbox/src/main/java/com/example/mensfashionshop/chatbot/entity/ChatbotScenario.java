package com.example.mensfashionshop.chatbot.entity;

import com.example.mensfashionshop.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "chatbot_scenarios")
public class ChatbotScenario extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "question_pattern", nullable = false, length = 500)
    private String questionPattern;

    @Column(length = 500)
    private String keywords;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "target_url")
    private String targetUrl;

    /**
     * TEXT | PRODUCT | SHOP_INFO
     */
    @Column(name = "scenario_type", nullable = false, length = 30)
    private String scenarioType = "TEXT";

    /**
     * GENERAL | PRODUCT | BOTH
     */
    @Column(name = "scope_type", nullable = false, length = 20)
    private String scopeType = "GENERAL";
}