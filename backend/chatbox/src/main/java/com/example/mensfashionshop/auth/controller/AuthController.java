package com.example.mensfashionshop.auth.controller;

import com.example.mensfashionshop.auth.dto.AuthResponse;
import com.example.mensfashionshop.auth.dto.LoginRequest;
import com.example.mensfashionshop.auth.dto.RegisterRequest;
import com.example.mensfashionshop.auth.service.AuthService;
import com.example.mensfashionshop.security.CustomUserDetails;
import com.example.mensfashionshop.user.entity.User;
import com.example.mensfashionshop.user.repository.UserRepository;
import com.example.mensfashionshop.auth.dto.CreateStaffRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.registerCustomer(request);
    }

    @PostMapping("/admin/create-user")
    @PreAuthorize("hasRole('ADMIN')")
    public AuthResponse createInternalUser(@Valid @RequestBody CreateStaffRequest request) {
        return authService.createInternalUser(request);
    }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new RuntimeException("Chưa đăng nhập");
        }

        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("username", user.getUsername());
        result.put("fullName", user.getFullName());
        result.put("email", user.getEmail());
        result.put("phone", user.getPhone());
        result.put("roles", user.getRoles().stream().map(r -> r.getName().name()).toList());
        return result;
    }
}