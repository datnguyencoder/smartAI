package com.smartmart.repository;

import com.smartmart.entity.Shift;
import com.smartmart.enums.ShiftStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShiftRepository extends JpaRepository<Shift, Long> {
    Optional<Shift> findByCashierIdAndStatus(Long cashierId, ShiftStatus status);
    List<Shift> findAllByOrderByIdDesc();
    List<Shift> findByCashierIdOrderByIdDesc(Long cashierId);
}
