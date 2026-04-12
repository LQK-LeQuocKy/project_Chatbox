package com.example.mensfashionshop.chatbot.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatbotScenarioRequest {
    private String title;
    private String questionPattern;
    private String keywords;
    private String answer;
    private String scenarioType;
    private String scopeType;
    private Boolean active;
    private Boolean overwrite;
}