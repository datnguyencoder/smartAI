package com.smartmart.repository;

import com.smartmart.entity.PurchaseOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, Long> {
    boolean existsByItemId(Long itemId);

    // Nhà cung cấp đã nhập gần nhất cho sản phẩm này — dùng làm gợi ý mặc định
    // khi lập phiếu nhập từ đề xuất AI (business rule: ưu tiên NCC quen thuộc).
    Optional<PurchaseOrderItem> findFirstByItem_IdOrderByPurchaseOrder_CreatedAtDesc(Long itemId);
}
