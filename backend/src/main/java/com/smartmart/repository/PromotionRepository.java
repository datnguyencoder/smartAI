package com.smartmart.repository;

import com.smartmart.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    Optional<Promotion> findByCodeIgnoreCase(String code);

    List<Promotion> findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            LocalDate startDate, LocalDate endDate);

    List<Promotion> findByActiveTrueOrderByCreatedAtDesc();
}
