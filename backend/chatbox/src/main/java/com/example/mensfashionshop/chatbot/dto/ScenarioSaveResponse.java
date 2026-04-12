package com.example.mensfashionshop.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ScenarioSaveResponse {
    private boolean success;
    private boolean duplicated;
    private String message;
    private Long scenarioId;
}