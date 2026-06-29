package com.smartmart.repository;

import com.smartmart.entity.FinanceTransaction;
import com.smartmart.enums.FinanceTransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface FinanceTransactionRepository extends JpaRepository<FinanceTransaction, Long> {
    @Query("""
            SELECT ft FROM FinanceTransaction ft
            WHERE (:type IS NULL OR ft.type = :type)
              AND (:from IS NULL OR ft.transactionDate >= :from)
              AND (:to IS NULL OR ft.transactionDate <= :to)
            ORDER BY ft.transactionDate DESC, ft.id DESC
            """)
    List<FinanceTransaction> findFiltered(
            @Param("type") FinanceTransactionType type,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
