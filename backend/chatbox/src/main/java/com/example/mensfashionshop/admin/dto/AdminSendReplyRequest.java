package com.example.mensfashionshop.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminSendReplyRequest {
    @NotBlank
    private String message;
}