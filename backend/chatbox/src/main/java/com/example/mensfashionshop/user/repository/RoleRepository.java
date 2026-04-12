package com.example.mensfashionshop.user.repository;

import com.example.mensfashionshop.user.entity.Role;
import com.example.mensfashionshop.user.entity.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);
}