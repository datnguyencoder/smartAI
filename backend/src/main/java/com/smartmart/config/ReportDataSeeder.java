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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Seed purchase orders + inventory_logs so that the Purchase Report
 * and Inventory Report APIs return realistic test data.
 * Runs AFTER RetailSalesHistorySeeder (@Order(3)).
 */
@Component
@Profile({"local", "prod"})
@Order(6)
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
        // Shift existing POs if they are already seeded
        if (purchaseOrderRepository.count() > 0 || inventoryLogRepository.count() > 0) {
            shiftPurchaseOrdersIfStale();
            log.debug("Report seed data already exists, skipping seeding");
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

        // Calculate sold quantities to size purchases realistically
        Map<Long, BigDecimal> soldQuantities = new HashMap<>();
        List<com.smartmart.entity.Order> completedOrders = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                .toList();
        for (com.smartmart.entity.Order order : completedOrders) {
            for (OrderItem oi : order.getItems()) {
                Long itemId = oi.getItem().getId();
                soldQuantities.put(itemId, soldQuantities.getOrDefault(itemId, BigDecimal.ZERO).add(oi.getQuantity()));
            }
        }

        // --- 2. Create purchase orders (monthly, Jul–Dec 2011 shifted) ---
        int poCount = seedPurchaseOrders(allItems, suppliers, location, warehouseUserId, soldQuantities);

        // --- 3. Create inventory_logs for purchases and sales ---
        int logCount = seedInventoryLogs(allItems, location, warehouseUserId, staffUserId);

        // Align createdAt of new POs with their purchaseDate
        List<PurchaseOrder> allPOs = purchaseOrderRepository.findAll();
        for (PurchaseOrder po : allPOs) {
            po.setCreatedAt(po.getPurchaseDate());
        }
        purchaseOrderRepository.saveAll(allPOs);

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
            Long userId,
            Map<Long, BigDecimal> soldQuantities
    ) {
        YearMonth start = YearMonth.of(2011, 7);
        YearMonth end = YearMonth.of(2011, 12);
        int poSeq = 0;

        // 1. Calculate target purchase quantities to exceed sales by 25% (min 500 units)
        Map<Long, BigDecimal> targetPurchaseQuantities = new HashMap<>();
        for (Item item : items) {
            BigDecimal sold = soldQuantities.getOrDefault(item.getId(), BigDecimal.ZERO);
            BigDecimal target;
            if (sold.compareTo(BigDecimal.ZERO) > 0) {
                target = sold.multiply(BigDecimal.valueOf(1.25)).setScale(0, RoundingMode.CEILING);
            } else {
                target = BigDecimal.valueOf(500);
            }
            targetPurchaseQuantities.put(item.getId(), target);
        }

        // 2. Assign items to suppliers to simulate exclusive distribution
        Map<Long, List<Item>> supplierItems = new HashMap<>();
        for (Item item : items) {
            int supplierIdx = (int) (item.getId() % suppliers.size());
            Supplier supplier = suppliers.get(supplierIdx);
            supplierItems.computeIfAbsent(supplier.getId(), k -> new ArrayList<>()).add(item);
        }

        // 3. Generate POs month by month
        for (YearMonth ym = start; !ym.isAfter(end); ym = ym.plusMonths(1)) {
            for (Supplier supplier : suppliers) {
                List<Item> assignedItems = supplierItems.getOrDefault(supplier.getId(), Collections.emptyList());
                if (assignedItems.isEmpty()) {
                    continue;
                }

                poSeq++;
                LocalDateTime poDate = shiftToRecentWindow(ym.atDay(1).atTime(LocalTime.of(9, 0)));

                PurchaseOrder po = PurchaseOrder.builder()
                        .supplier(supplier)
                        .location(location)
                        .createdBy(userId)
                        .status(PurchaseStatus.COMPLETED)
                        .purchaseDate(poDate)
                        .completedAt(poDate.plusDays(2))
                        .totalAmount(BigDecimal.ZERO)
                        .items(new ArrayList<>())
                        .build();
                po = purchaseOrderRepository.save(po);

                BigDecimal poTotal = BigDecimal.ZERO;
                for (Item item : assignedItems) {
                    BigDecimal totalTarget = targetPurchaseQuantities.get(item.getId());
                    BigDecimal qty = totalTarget.divide(BigDecimal.valueOf(6), 0, RoundingMode.HALF_UP);
                    if (qty.compareTo(BigDecimal.ZERO) <= 0) {
                        qty = BigDecimal.ONE;
                    }
                    BigDecimal unitPrice = item.getCostPrice();
                    BigDecimal subtotal = unitPrice.multiply(qty).setScale(2, RoundingMode.HALF_UP);

                    PurchaseOrderItem poi = PurchaseOrderItem.builder()
                            .purchaseOrder(po)
                            .item(item)
                            .orderedQty(qty)
                            .receivedQty(qty)
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
                    .createdAt(shiftToRecentWindow(LocalDateTime.of(2011, 10, 15, 14, 0)))
                    .build();
            inventoryLogRepository.save(logEntry);
            count++;
        }

        return count;
    }

    private static final LocalDate CSV_DATA_END = LocalDate.of(2011, 12, 10);

    private static LocalDateTime shiftToRecentWindow(LocalDateTime originalDateTime) {
        LocalDate targetEnd = LocalDate.now().minusDays(1);
        long offsetDays = ChronoUnit.DAYS.between(CSV_DATA_END, targetEnd);
        return originalDateTime.plusDays(offsetDays);
    }

    private void shiftPurchaseOrdersIfStale() {
        List<PurchaseOrder> allPOs = purchaseOrderRepository.findAll();
        if (allPOs.isEmpty()) {
            return;
        }
        LocalDateTime maxDate = allPOs.stream()
                .map(PurchaseOrder::getPurchaseDate)
                .max(LocalDateTime::compareTo)
                .orElse(LocalDateTime.now());
        if (!maxDate.isBefore(LocalDateTime.now().minusDays(60))) {
            return;
        }
        long offsetDays = ChronoUnit.DAYS.between(maxDate.toLocalDate(), LocalDate.now().minusDays(1));
        
        // 1. Shift PurchaseOrders
        for (PurchaseOrder po : allPOs) {
            po.setPurchaseDate(po.getPurchaseDate().plusDays(offsetDays));
            if (po.getCompletedAt() != null) {
                po.setCompletedAt(po.getCompletedAt().plusDays(offsetDays));
            }
            if (po.getCreatedAt() != null) {
                po.setCreatedAt(po.getCreatedAt().plusDays(offsetDays));
            }
        }
        purchaseOrderRepository.saveAll(allPOs);

        // 2. Shift InventoryLogs for PURCHASES and SCRAP
        List<InventoryLog> logs = inventoryLogRepository.findAll();
        for (InventoryLog logEntry : logs) {
            if (logEntry.getReferenceType() == ReferenceType.PURCHASE_ORDER || logEntry.getActionType() == InventoryActionType.SCRAP) {
                if (logEntry.getCreatedAt().isBefore(LocalDateTime.now().minusDays(60))) {
                    logEntry.setCreatedAt(logEntry.getCreatedAt().plusDays(offsetDays));
                    inventoryLogRepository.save(logEntry);
                }
            }
        }
        log.info("Shifted {} purchase orders and inventory logs forward by {} days", allPOs.size(), offsetDays);
    }
}
