package com.smartmart.repository;

import com.smartmart.entity.OnlineOrderRequest;
import com.smartmart.enums.OnlineOrderRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OnlineOrderRequestRepository extends JpaRepository<OnlineOrderRequest, Long> {
    List<OnlineOrderRequest> findByStatusOrderByCreatedAtDesc(OnlineOrderRequestStatus status);

    List<OnlineOrderRequest> findAllByOrderByCreatedAtDesc();
}
