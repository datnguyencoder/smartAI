package com.smartmart.repository;

import com.smartmart.entity.FinanceCategory;
import com.smartmart.enums.FinanceTransactionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinanceCategoryRepository extends JpaRepository<FinanceCategory, Long> {
    List<FinanceCategory> findByActiveTrueOrderByNameAsc();

    List<FinanceCategory> findByTypeAndActiveTrueOrderByNameAsc(FinanceTransactionType type);
}
