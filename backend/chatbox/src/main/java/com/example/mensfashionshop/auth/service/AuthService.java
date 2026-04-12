package com.example.mensfashionshop.auth.service;

import com.example.mensfashionshop.auth.dto.AuthResponse;
import com.example.mensfashionshop.auth.dto.LoginRequest;
import com.example.mensfashionshop.auth.dto.RegisterRequest;
import com.example.mensfashionshop.security.CustomUserDetails;
import com.example.mensfashionshop.security.JwtTokenProvider;
import com.example.mensfashionshop.user.entity.Role;
import com.example.mensfashionshop.user.entity.RoleName;
import com.example.mensfashionshop.user.entity.User;
import com.example.mensfashionshop.user.repository.RoleRepository;
import com.example.mensfashionshop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.mensfashionshop.auth.dto.CreateStaffRequest;


import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(userDetails);

        return new AuthResponse(
                token,
                "Bearer",
                userDetails.getId(),
                userDetails.getUsername(),
                userRepository.findByUsername(userDetails.getUsername()).map(User::getFullName).orElse(""),
                userDetails.getRoleNames()
        );
    }

    @Transactional
    public AuthResponse registerCustomer(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username đã tồn tại");
        }

        if (request.getEmail() != null && !request.getEmail().isBlank() && userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã tồn tại");
        }

        Role customerRole = roleRepository.findByName(RoleName.ROLE_CUSTOMER)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy role ROLE_CUSTOMER"));

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setEnabled(true);
        user.getRoles().add(customerRole);

        User savedUser = userRepository.save(user);

        CustomUserDetails userDetails = new CustomUserDetails(savedUser);
        String token = jwtTokenProvider.generateToken(userDetails);

        Set<String> roles = savedUser.getRoles()
                .stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());

        return new AuthResponse(
                token,
                "Bearer",
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getFullName(),
                roles
        );
    }

    @Transactional
    public AuthResponse createInternalUser(CreateStaffRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username đã tồn tại");
        }

        RoleName roleName;
        try {
            roleName = RoleName.valueOf(request.getRole());
        } catch (Exception ex) {
            throw new RuntimeException("Role không hợp lệ");
        }

        if (roleName != RoleName.ROLE_STAFF && roleName != RoleName.ROLE_ADMIN) {
            throw new RuntimeException("Chỉ được tạo ROLE_STAFF hoặc ROLE_ADMIN");
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy role " + roleName.name()));

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setEnabled(true);
        user.getRoles().add(role);

        User savedUser = userRepository.save(user);

        CustomUserDetails userDetails = new CustomUserDetails(savedUser);
        String token = jwtTokenProvider.generateToken(userDetails);

        return new AuthResponse(
                token,
                "Bearer",
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getFullName(),
                userDetails.getRoleNames()
        );
    }
}