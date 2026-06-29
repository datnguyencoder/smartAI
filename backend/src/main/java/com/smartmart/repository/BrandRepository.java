package com.smartmart.repository;

import com.smartmart.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BrandRepository extends JpaRepository<Brand, Long> {
    List<Brand> findByActiveTrueOrderByBrandNameAsc();

    Optional<Brand> findByBrandNameIgnoreCase(String brandName);

    boolean existsByBrandNameIgnoreCase(String brandName);
}
