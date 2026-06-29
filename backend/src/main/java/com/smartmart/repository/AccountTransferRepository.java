package com.smartmart.repository;

import com.smartmart.entity.AccountTransfer;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountTransferRepository extends JpaRepository<AccountTransfer, Long> {
    @EntityGraph(attributePaths = {"fromAccount", "toAccount"})
    List<AccountTransfer> findAllByOrderByTransferDateDesc();
}
