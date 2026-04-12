package com.example.mensfashionshop.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductChatItem {
    private Long id;
    private String name;
    private String image;
    private Double price;
    private String shortDescription;
    private String productUrl;
}