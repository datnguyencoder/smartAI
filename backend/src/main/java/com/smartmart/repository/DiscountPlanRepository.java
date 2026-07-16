package com.smartmart.repository;

import com.smartmart.entity.DiscountPlan;
import com.smartmart.enums.DiscountPlanType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface DiscountPlanRepository extends JpaRepository<DiscountPlan, Long> {
    List<DiscountPlan> findByActiveTrueOrderByPlanNameAsc();

    @Query("""
        SELECT dp FROM DiscountPlan dp
        WHERE dp.active = true
          AND (dp.startDate IS NULL OR dp.startDate <= :today)
          AND (dp.endDate IS NULL OR dp.endDate >= :today)
        ORDER BY dp.planName ASC
        """)
    List<DiscountPlan> findAllActiveToday(@Param("today") LocalDate today);

    @Query("""
        SELECT dp FROM DiscountPlan dp
        WHERE dp.active = true
          AND dp.planType = :planType
          AND (dp.startDate IS NULL OR dp.startDate <= :today)
          AND (dp.endDate IS NULL OR dp.endDate >= :today)
        """)
    List<DiscountPlan> findActiveByType(@Param("planType") DiscountPlanType planType, @Param("today") LocalDate today);
}
