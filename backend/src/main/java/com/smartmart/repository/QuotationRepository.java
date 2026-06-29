package com.smartmart.repository;

import com.smartmart.entity.Quotation;
import com.smartmart.enums.QuotationStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuotationRepository extends JpaRepository<Quotation, Long> {
    @EntityGraph(attributePaths = {"items", "items.item"})
    Optional<Quotation> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"items", "items.item"})
    List<Quotation> findByStatusOrderByCreatedAtDesc(QuotationStatus status);

    @EntityGraph(attributePaths = {"items", "items.item"})
    List<Quotation> findAllByOrderByCreatedAtDesc();
}
