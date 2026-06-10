package com.smartmart.repository;

import com.smartmart.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    Optional<Supplier> findBySupplierName(String supplierName);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Supplier s WHERE " +
            "(:q = '' OR LOWER(s.supplierName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(s.phone) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(s.email) LIKE LOWER(CONCAT('%', :q, '%'))) "
            +
            "AND (:active IS NULL OR s.active = :active) " +
            "ORDER BY s.id DESC")
    java.util.List<Supplier> findFiltered(@org.springframework.data.repository.query.Param("q") String q,
            @org.springframework.data.repository.query.Param("active") Boolean active);
}
