package com.example.mensfashionshop.admin.controller;

import com.example.mensfashionshop.admin.dto.AdminChartsResponse;
import com.example.mensfashionshop.admin.service.AdminChartsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/charts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminChartsController {

    private final AdminChartsService adminChartsService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public AdminChartsResponse getChartsData() {
        return adminChartsService.getChartsData();
    }
}