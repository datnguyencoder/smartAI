package com.smartmart.repository;

import com.smartmart.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    Optional<Supplier> findBySupplierName(String supplierName);

    @Query("SELECT s FROM Supplier s WHERE " +
            "(:q = '' OR LOWER(s.supplierName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(s.phone) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(s.email) LIKE LOWER(CONCAT('%', :q, '%'))) "
            +
            "AND (:active IS NULL OR s.active = :active) " +
            "ORDER BY s.id DESC")
    List<Supplier> findFiltered(@Param("q") String q,
            @Param("active") Boolean active);
}
