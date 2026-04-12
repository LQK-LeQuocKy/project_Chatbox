package com.example.mensfashionshop.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateStaffRequest {

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    @NotBlank
    private String fullName;

    private String email;
    private String phone;

    @NotBlank
    private String role; // ROLE_STAFF hoặc ROLE_ADMIN
}