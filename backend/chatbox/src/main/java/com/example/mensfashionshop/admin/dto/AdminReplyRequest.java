package com.example.mensfashionshop.admin.dto;

import lombok.Data;

@Data
public class AdminReplyRequest {
    private Long unresolvedId;
    private String reply;
}