
package com.smartmart.repository;

import com.smartmart.entity.PurchaseOrder;
import com.smartmart.enums.PurchaseStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PurchaseOrderRepository
    extends JpaRepository<PurchaseOrder, Long>, JpaSpecificationExecutor<PurchaseOrder> {

  Page<PurchaseOrder> findByStatusOrderByPurchaseDateDesc(PurchaseStatus status, Pageable pageable);

  @EntityGraph(attributePaths = { "supplier", "location", "items", "items.item" })
  List<PurchaseOrder> findAllByOrderByPurchaseDateDesc();

  @EntityGraph(attributePaths = { "supplier", "location", "items", "items.item" })
  Optional<PurchaseOrder> findWithDetailsById(Long id);

  @EntityGraph(attributePaths = { "supplier", "location", "items", "items.item" })
  List<PurchaseOrder> findByIdInOrderByCreatedAtDesc(List<Long> ids);

  @EntityGraph(attributePaths = { "supplier", "items", "items.item" })
  List<PurchaseOrder> findByPurchaseDateBetweenAndStatusNot(LocalDateTime from, LocalDateTime to,
      PurchaseStatus status);

  @Query(value = """
      SELECT s.id, s.supplier_name,
             COUNT(DISTINCT po.id) as total_orders,
             COALESCE(SUM(po.total_amount), 0) as total_amount,
             COUNT(DISTINCT poi.item_id) as item_types,
             COALESCE(SUM(poi.received_qty), 0) as total_qty
      FROM purchase_orders po
      JOIN suppliers s ON s.id = po.supplier_id
      JOIN purchase_order_items poi ON poi.purchase_id = po.id
      WHERE po.status != 'CANCELLED'
        AND po.purchase_date >= :from AND po.purchase_date < :to
      GROUP BY s.id, s.supplier_name
      ORDER BY total_amount DESC
      """, nativeQuery = true)
  List<Object[]> reportPurchaseBySupplier(java.time.LocalDateTime from, java.time.LocalDateTime to);

  @EntityGraph(attributePaths = {"supplier", "items"})
  @Query("SELECT DISTINCT po FROM PurchaseOrder po WHERE po.purchaseDate >= :from AND po.purchaseDate < :to")
  List<PurchaseOrder> findAllByPurchaseDateBetween(@Param("from") java.time.LocalDateTime from, @Param("to") java.time.LocalDateTime to);
}
