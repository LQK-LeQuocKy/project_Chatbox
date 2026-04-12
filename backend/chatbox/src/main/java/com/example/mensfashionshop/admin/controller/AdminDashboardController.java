package com.example.mensfashionshop.admin.controller;

import com.example.mensfashionshop.admin.dto.DashboardStatsResponse;
import com.example.mensfashionshop.admin.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/stats")
    public DashboardStatsResponse getDashboardStats() {
        return adminDashboardService.getDashboardStats();
    }
}