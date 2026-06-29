package com.smartmart.repository;

import com.smartmart.entity.CashAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CashAccountRepository extends JpaRepository<CashAccount, Long> {
    List<CashAccount> findByActiveTrueOrderByAccountNameAsc();
}
