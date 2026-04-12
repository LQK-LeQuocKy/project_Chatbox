package com.example.mensfashionshop.auth.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class TestRoleController {

    @GetMapping("/customer/hello")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public String customerHello() {
        return "Xin chào CUSTOMER / STAFF / ADMIN";
    }

    @GetMapping("/staff/hello")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public String staffHello() {
        return "Xin chào STAFF / ADMIN";
    }

    @GetMapping("/admin/hello")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminHello() {
        return "Xin chào ADMIN";
    }
}