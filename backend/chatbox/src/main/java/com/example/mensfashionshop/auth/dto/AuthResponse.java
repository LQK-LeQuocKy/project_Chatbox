package com.example.mensfashionshop.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String type;
    private Long userId;
    private String username;
    private String fullName;
    private Set<String> roles;
}