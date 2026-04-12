package com.example.mensfashionshop.chatbot.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminReplyRequest {

    @NotBlank
    private String reply;
}