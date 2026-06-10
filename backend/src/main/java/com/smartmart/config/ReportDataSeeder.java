package com.smartmart.config;

import com.smartmart.entity.*;
import com.smartmart.enums.*;
import com.smartmart.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.*;

/**
 * Seed purchase orders + inventory_logs so that the Purchase Report
 * and Inventory Report APIs return realistic test data.
 * Runs AFTER RetailSalesHistorySeeder (@Order(3)).
 */
@Component
@Profile({"local", "prod"})
@Order(3)
public class ReportDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ReportDataSeeder.class);
    private static final String PO_PREFIX = "SEED-PO-";

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final OrderRepository orderRepository;
    private final ItemRepository itemRepository;
    private final SupplierRepository supplierRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;

    public ReportDataSeeder(
            PurchaseOrderRepository purchaseOrderRepository,
            InventoryLogRepository inventoryLogRepository,
            OrderRepository orderRepository,
            ItemRepository itemRepository,
            SupplierRepository supplierRepository,
            LocationRepository locationRepository,
            UserRepository userRepository
    ) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.inventoryLogRepository = inventoryLogRepository;
        this.orderRepository = orderRepository;
        this.itemRepository = itemRepository;
        this.supplierRepository = supplierRepository;
        this.locationRepository = locationRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // Skip if already seeded
        if (purchaseOrderRepository.count() > 0 || inventoryLogRepository.count() > 0) {
            log.debug("Report seed data already exists, skipping");
            return;
        }

        List<Item> allItems = itemRepository.findAll();
        if (allItems.isEmpty()) {
            log.warn("No items found — skipping report data seed");
            return;
        }

        Location location = locationRepository.findAll().stream().findFirst().orElse(null);
        if (location == null) {
            log.warn("No location found — skipping report data seed");
            return;
        }

        Long warehouseUserId = userRepository.findByUsername("warehouse")
                .map(User::getId).orElse(null);
        Long staffUserId = userRepository.findByUsername("staff")
                .map(User::getId).orElse(null);

        // --- 1. Create additional suppliers ---
        List<Supplier> suppliers = seedSuppliers();

        // --- 2. Create purchase orders (monthly, Jul–Dec 2011) ---
        int poCount = seedPurchaseOrders(allItems, suppliers, location, warehouseUserId);

        // --- 3. Create inventory_logs for purchases and sales ---
        int logCount = seedInventoryLogs(allItems, location, warehouseUserId, staffUserId);

        log.info("Report data seeded: {} purchase orders, {} inventory logs", poCount, logCount);
    }

    // ──────────────────────────── Suppliers ────────────────────────────

    private List<Supplier> seedSuppliers() {
        // Keep existing Vinamilk, add more suppliers for variety
        List<Supplier> existing = supplierRepository.findAll();
        List<Supplier> result = new ArrayList<>(existing);

        if (supplierRepository.count() < 3) {
            result.add(supplierRepository.save(Supplier.builder()
                    .supplierName("Tổng kho ABC")
                    .contactPerson("Nguyễn Văn A")
                    .phone("0901234567")
                    .email("abc@supplier.com")
                    .active(true)
                    .build()));
            result.add(supplierRepository.save(Supplier.builder()
                    .supplierName("Nhà phân phối XYZ")
                    .contactPerson("Trần Thị B")
                    .phone("0912345678")
                    .email("xyz@supplier.com")
                    .active(true)
                    .build()));
        }
        return result;
    }

    // ──────────────────────────── Purchase Orders ────────────────────────────

    private int seedPurchaseOrders(
            List<Item> items,
            List<Supplier> suppliers,
            Location location,
            Long userId
    ) {
        // Generate 1 PO per supplier per month (Jul–Dec 2011)
        YearMonth start = YearMonth.of(2011, 7);
        YearMonth end = YearMonth.of(2011, 12);
        int poSeq = 0;
        Random rng = new Random(42);

        for (YearMonth ym = start; !ym.isAfter(end); ym = ym.plusMonths(1)) {
            for (Supplier supplier : suppliers) {
                poSeq++;
                LocalDateTime poDate = ym.atDay(1).atTime(LocalTime.of(9, 0));

                PurchaseOrder po = PurchaseOrder.builder()
                        .supplier(supplier)
                        .location(location)
                        .createdBy(userId)
                        .status(PurchaseStatus.COMPLETED)
                        .purchaseDate(poDate)
                        .completedAt(poDate.plusDays(2))
                        .totalAmount(BigDecimal.ZERO)
                        .build();
                po = purchaseOrderRepository.save(po);

                // Add 2–4 random items per PO
                int itemCount = 2 + rng.nextInt(3);
                List<Item> shuffled = new ArrayList<>(items);
                Collections.shuffle(shuffled, rng);
                BigDecimal poTotal = BigDecimal.ZERO;

                for (int i = 0; i < Math.min(itemCount, shuffled.size()); i++) {
                    Item item = shuffled.get(i);
                    BigDecimal qty = BigDecimal.valueOf(50 + rng.nextInt(200));
                    BigDecimal unitPrice = item.getCostPrice();
                    BigDecimal subtotal = unitPrice.multiply(qty).setScale(2, RoundingMode.HALF_UP);

                    PurchaseOrderItem poi = PurchaseOrderItem.builder()
                            .purchaseOrder(po)
                            .item(item)
                            .orderedQty(qty)
                            .receivedQty(qty) // fully received
                            .unitPrice(unitPrice)
                            .subtotal(subtotal)
                            .build();
                    po.getItems().add(poi);
                    poTotal = poTotal.add(subtotal);
                }

                po.setTotalAmount(poTotal);
                purchaseOrderRepository.save(po);
            }
        }
        return poSeq;
    }

    // ──────────────────────────── Inventory Logs ────────────────────────────

    private int seedInventoryLogs(
            List<Item> items,
            Location location,
            Long warehouseUserId,
            Long staffUserId
    ) {
        int count = 0;

        // --- A. Logs for purchase receives (from the POs we just created) ---
        List<PurchaseOrder> allPOs = purchaseOrderRepository.findAll();
        for (PurchaseOrder po : allPOs) {
            for (PurchaseOrderItem poi : po.getItems()) {
                BigDecimal qty = poi.getReceivedQty();
                InventoryLog logEntry = InventoryLog.builder()
                        .item(poi.getItem())
                        .location(location)
                        .lot(null)
                        .userId(warehouseUserId)
                        .referenceType(ReferenceType.PURCHASE_ORDER)
                        .referenceId(po.getId())
                        .actionType(InventoryActionType.PURCHASE_RECEIVE)
                        .quantityBefore(BigDecimal.ZERO)
                        .quantityChange(qty)                // positive = incoming
                        .quantityAfter(qty)
                        .note("Seed: nhập hàng PO " + po.getId())
                        .createdAt(po.getCompletedAt() != null ? po.getCompletedAt() : po.getPurchaseDate())
                        .build();
                inventoryLogRepository.save(logEntry);
                count++;
            }
        }

        // --- B. Logs for sales (from existing COMPLETED orders) ---
        List<com.smartmart.entity.Order> completedOrders = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                .toList();

        for (com.smartmart.entity.Order order : completedOrders) {
            for (OrderItem oi : order.getItems()) {
                BigDecimal qty = oi.getQuantity();
                InventoryLog logEntry = InventoryLog.builder()
                        .item(oi.getItem())
                        .location(location)
                        .lot(null)
                        .userId(staffUserId)
                        .referenceType(ReferenceType.ORDER)
                        .referenceId(order.getId())
                        .actionType(InventoryActionType.SALE)
                        .quantityBefore(qty)
                        .quantityChange(qty.negate())       // negative = outgoing
                        .quantityAfter(BigDecimal.ZERO)
                        .note("Seed: bán hàng " + order.getOrderCode())
                        .createdAt(order.getOrderDate())
                        .build();
                inventoryLogRepository.save(logEntry);
                count++;
            }
        }

        // --- C. A few scrap entries for realism ---
        Random rng = new Random(99);
        List<Item> scrappable = items.stream().limit(3).toList();
        for (Item item : scrappable) {
            BigDecimal qty = BigDecimal.valueOf(5 + rng.nextInt(10));
            InventoryLog logEntry = InventoryLog.builder()
                    .item(item)
                    .location(location)
                    .lot(null)
                    .userId(warehouseUserId)
                    .referenceType(ReferenceType.SCRAP_ORDER)
                    .referenceId(null)
                    .actionType(InventoryActionType.SCRAP)
                    .quantityBefore(qty)
                    .quantityChange(qty.negate())
                    .quantityAfter(BigDecimal.ZERO)
                    .note("Seed: hủy hàng hư / hết hạn")
                    .createdAt(LocalDateTime.of(2011, 10, 15, 14, 0))
                    .build();
            inventoryLogRepository.save(logEntry);
            count++;
        }

        return count;
    }
}
