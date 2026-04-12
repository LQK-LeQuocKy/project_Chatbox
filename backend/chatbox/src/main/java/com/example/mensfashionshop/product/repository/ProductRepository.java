package com.example.mensfashionshop.product.repository;

import com.example.mensfashionshop.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Pageable;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByActiveTrue();
    List<Product> findByNameContainingIgnoreCase(String keyword, Pageable pageable);

    List<Product> findByCategoryNameContainingIgnoreCase(String keyword, Pageable pageable);
}