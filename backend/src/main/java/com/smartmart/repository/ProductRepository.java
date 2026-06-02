package com.smartmart.repository;

import com.smartmart.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findByCode(String code);
    Optional<Product> findBySku(String sku);
    
    @Query("SELECT p FROM Product p WHERE p.quantity <= p.minimumStock")
    List<Product> findLowStockProducts();

    Page<Product> findByCategoryId(UUID categoryId, Pageable pageable);
}
