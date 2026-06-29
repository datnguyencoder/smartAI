package com.smartmart.repository;

import com.smartmart.entity.CustomerDebt;
import com.smartmart.enums.CustomerDebtStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerDebtRepository extends JpaRepository<CustomerDebt, Long> {
    @EntityGraph(attributePaths = {"customer", "order", "payments"})
    List<CustomerDebt> findAllByOrderByIdDesc();

    @EntityGraph(attributePaths = {"customer", "order", "payments"})
    List<CustomerDebt> findByStatusOrderByIdDesc(CustomerDebtStatus status);

    @EntityGraph(attributePaths = {"customer", "order", "payments"})
    List<CustomerDebt> findByCustomerIdOrderByIdDesc(Long customerId);

    @EntityGraph(attributePaths = {"customer", "order", "payments"})
    Optional<CustomerDebt> findWithDetailsById(Long id);

    boolean existsByOrderId(Long orderId);
}
