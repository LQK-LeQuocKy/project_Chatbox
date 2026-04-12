package com.example.mensfashionshop.user.controller;

import com.example.mensfashionshop.user.dto.AdminUserResponse;
import com.example.mensfashionshop.user.entity.User;
import com.example.mensfashionshop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserAdminController {

    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public List<AdminUserResponse> getAll() {
        return userRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(User::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse)
                .toList();
    }

    @PutMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminUserResponse toggleStatus(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        user.setEnabled(!user.isEnabled());
        User saved = userRepository.save(user);

        return toResponse(saved);
    }

    private AdminUserResponse toResponse(User user) {
        String role = "CUSTOMER";

        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            role = user.getRoles()
                    .iterator()
                    .next()
                    .getName()
                    .name()
                    .replace("ROLE_", "");
        }

        return AdminUserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(role)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .enabled(user.isEnabled())
                .build();
    }
}