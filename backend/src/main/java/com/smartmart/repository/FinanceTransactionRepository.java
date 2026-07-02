package com.smartmart.repository;

import com.smartmart.entity.FinanceTransaction;
import com.smartmart.enums.FinanceTransactionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface FinanceTransactionRepository extends JpaRepository<FinanceTransaction, Long> {

    default List<FinanceTransaction> findFiltered(FinanceTransactionType type, LocalDate from, LocalDate to) {
        if (type != null && from != null && to != null) {
            return findByTypeAndTransactionDateBetweenOrderByTransactionDateDescIdDesc(type, from, to);
        }
        if (type != null && from != null) {
            return findByTypeAndTransactionDateGreaterThanEqualOrderByTransactionDateDescIdDesc(type, from);
        }
        if (type != null && to != null) {
            return findByTypeAndTransactionDateLessThanEqualOrderByTransactionDateDescIdDesc(type, to);
        }
        if (type != null) {
            return findByTypeOrderByTransactionDateDescIdDesc(type);
        }
        if (from != null && to != null) {
            return findByTransactionDateBetweenOrderByTransactionDateDescIdDesc(from, to);
        }
        if (from != null) {
            return findByTransactionDateGreaterThanEqualOrderByTransactionDateDescIdDesc(from);
        }
        if (to != null) {
            return findByTransactionDateLessThanEqualOrderByTransactionDateDescIdDesc(to);
        }
        return findAllByOrderByTransactionDateDescIdDesc();
    }

    List<FinanceTransaction> findAllByOrderByTransactionDateDescIdDesc();

    List<FinanceTransaction> findByTypeOrderByTransactionDateDescIdDesc(FinanceTransactionType type);

    List<FinanceTransaction> findByTransactionDateBetweenOrderByTransactionDateDescIdDesc(LocalDate from, LocalDate to);

    List<FinanceTransaction> findByTransactionDateGreaterThanEqualOrderByTransactionDateDescIdDesc(LocalDate from);

    List<FinanceTransaction> findByTransactionDateLessThanEqualOrderByTransactionDateDescIdDesc(LocalDate to);

    List<FinanceTransaction> findByTypeAndTransactionDateBetweenOrderByTransactionDateDescIdDesc(
            FinanceTransactionType type,
            LocalDate from,
            LocalDate to);

    List<FinanceTransaction> findByTypeAndTransactionDateGreaterThanEqualOrderByTransactionDateDescIdDesc(
            FinanceTransactionType type,
            LocalDate from);

    List<FinanceTransaction> findByTypeAndTransactionDateLessThanEqualOrderByTransactionDateDescIdDesc(
            FinanceTransactionType type,
            LocalDate to);
}
