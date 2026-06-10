package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateOrderRequest;
import com.smartmart.dto.request.OrderLineRequest;
import com.smartmart.dto.response.OrderItemResponse;
import com.smartmart.dto.response.OrderResponse;
import com.smartmart.entity.*;
import com.smartmart.enums.InventoryActionType;
import com.smartmart.enums.OrderStatus;
import com.smartmart.enums.ReferenceType;
import com.smartmart.event.OrderEventPublisher;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.ForbiddenException;
import com.smartmart.repository.LocationRepository;
import com.smartmart.repository.OrderRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.InventoryAlertService;
import com.smartmart.service.InventoryLedgerService;
import com.smartmart.service.ItemService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class OrderServiceImpl implements com.smartmart.service.OrderService {

    private static final String DEFAULT_LOCATION = "Kho bán";

    private final OrderRepository orderRepository;
    private final ItemService itemService;
    private final LocationRepository locationRepository;
    private final InventoryLedgerService inventoryLedgerService;
    private final OrderEventPublisher orderEventPublisher;
    private final InventoryAlertService inventoryAlertService;
    private final AuditLogService auditLogService;
    private final com.smartmart.repository.UserRepository userRepository;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            ItemService itemService,
            LocationRepository locationRepository,
            InventoryLedgerService inventoryLedgerService,
            OrderEventPublisher orderEventPublisher,
            InventoryAlertService inventoryAlertService,
            AuditLogService auditLogService,
            com.smartmart.repository.UserRepository userRepository
    ) {
        this.orderRepository = orderRepository;
        this.itemService = itemService;
        this.locationRepository = locationRepository;
        this.inventoryLedgerService = inventoryLedgerService;
        this.orderEventPublisher = orderEventPublisher;
        this.inventoryAlertService = inventoryAlertService;
        this.auditLogService = auditLogService;
        this.userRepository = userRepository;
    }

    // POS: tạo hóa đơn, FEFO trừ tồn, publish event cảnh báo tồn
    @Override
    @CacheEvict(value = {"items", "itemsPage", "dashboardSummary", "dashboardRevenue"}, allEntries = true)
    public OrderResponse create(CreateOrderRequest request) {
        Location location = locationRepository.findByLocationName(DEFAULT_LOCATION)
                .orElseGet(() -> locationRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new BadRequestException("Hệ thống chưa có bất kỳ kho nào. Vui lòng tạo kho trước khi bán hàng.")));

        UUID userId = SecurityUtils.getCurrentUserId().orElse(null);
        String orderCode = "HD-" + System.currentTimeMillis();

        Order order = Order.builder()
                .orderCode(orderCode)
                .createdBy(userId)
                .customerName(request.getCustomerName() != null ? request.getCustomerName() : "Khách lẻ")
                .orderDate(LocalDateTime.now())
                .status(OrderStatus.COMPLETED)
                .paymentMethod(request.getPaymentMethod())
                .note(request.getNote())
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderLineRequest line : request.getItems()) {
            Item item = itemService.findItem(line.getItemId());
            if (!item.isActive()) {
                throw new BadRequestException("Sản phẩm không hoạt động: " + item.getItemName());
            }

            List<InventoryLedgerService.GlobalLotAllocation> allocations =
                    inventoryLedgerService.allocateGlobalFefo(item, line.getQuantity());

            for (InventoryLedgerService.GlobalLotAllocation alloc : allocations) {
                inventoryLedgerService.applyMovement(
                        item, alloc.location(), alloc.lot(),
                        alloc.quantity().negate(),
                        InventoryActionType.SALE,
                        ReferenceType.ORDER,
                        null,
                        userId,
                        "POS bán hàng"
                );

                BigDecimal subtotal = item.getSellingPrice().multiply(alloc.quantity());
                OrderItem oi = OrderItem.builder()
                        .order(order)
                        .item(item)
                        .lot(alloc.lot())
                        .quantity(alloc.quantity())
                        .unitPrice(item.getSellingPrice())
                        .subtotal(subtotal)
                        .build();
                orderItems.add(oi);
                total = total.add(subtotal);
            }
        }

        order.setTotalAmount(total);
        order.getItems().addAll(orderItems);
        Order saved = orderRepository.save(order);

        // Update reference id on logs would need second pass — acceptable for MVP
        orderEventPublisher.publishOrderCreated(saved.getId(), saved.getOrderCode());
        saved.getItems().forEach(oi -> inventoryAlertService.evaluateStockAfterSale(oi.getItem().getId()));
        auditLogService.log("ORDER_CREATE", "Hóa đơn " + saved.getOrderCode());

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> listAll() {
        boolean staffOnly = SecurityUtils.hasRole("STAFF")
                && !SecurityUtils.hasAnyRole("ADMIN", "MANAGER");
        if (staffOnly) {
            UUID userId = SecurityUtils.getCurrentUserId()
                    .orElseThrow(() -> new ForbiddenException("Không xác định được người dùng"));
            return orderRepository.findByCreatedByWithItems(userId).stream().map(this::toResponse).toList();
        }
        return orderRepository.findAllWithItems().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<OrderResponse> listPaged(int page, int size, String search, OrderStatus status, java.time.LocalDateTime fromDate, java.time.LocalDateTime toDate) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "orderDate"));
        org.springframework.data.domain.Page<Order> orderPage = orderRepository.searchOrders(
                (search != null && !search.trim().isEmpty()) ? search.trim() : null,
                status,
                fromDate,
                toDate,
                pageable
        );
        return orderPage.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getById(Long id) {
        Order order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new com.smartmart.exception.NotFoundException("Không tìm thấy hóa đơn"));
        assertStaffCanAccessOrder(order);
        return toResponse(order);
    }

    private void assertStaffCanAccessOrder(Order order) {
        boolean staffOnly = SecurityUtils.hasRole("STAFF")
                && !SecurityUtils.hasAnyRole("ADMIN", "MANAGER");
        if (!staffOnly) {
            return;
        }
        UUID userId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new ForbiddenException("Không xác định được người dùng"));
        if (order.getCreatedBy() == null || !order.getCreatedBy().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền xem hóa đơn này");
        }
    }

    @Override
    @CacheEvict(value = {"items", "itemsPage", "dashboardSummary", "dashboardRevenue"}, allEntries = true)
    public OrderResponse cancel(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new com.smartmart.exception.NotFoundException("Không tìm thấy hóa đơn"));
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Hóa đơn đã hủy");
        }
        Location location = locationRepository.findByLocationName(DEFAULT_LOCATION)
                .orElseGet(() -> locationRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new BadRequestException("Hệ thống chưa có bất kỳ kho nào.")));
        UUID userId = SecurityUtils.getCurrentUserId().orElse(null);

        for (OrderItem line : order.getItems()) {
            inventoryLedgerService.applyMovement(
                    line.getItem(), location, line.getLot(),
                    line.getQuantity(),
                    InventoryActionType.SALE_CANCEL,
                    ReferenceType.ORDER,
                    order.getId(),
                    userId,
                    "Hủy hóa đơn"
            );
        }
        order.setStatus(OrderStatus.CANCELLED);
        return toResponse(orderRepository.save(order));
    }

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(i -> OrderItemResponse.builder()
                        .itemId(i.getItem().getId())
                        .itemName(i.getItem().getItemName())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .subtotal(i.getSubtotal())
                        .build())
                .toList();
        String cashierName = "Hệ thống";
        if (order.getCreatedBy() != null) {
            cashierName = userRepository.findById(order.getCreatedBy())
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername())
                    .orElse("Hệ thống");
        }

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .customerName(order.getCustomerName())
                .cashierName(cashierName)
                .orderDate(order.getOrderDate())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .paymentMethod(order.getPaymentMethod())
                .items(items)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> suggestCustomers(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        return orderRepository.suggestCustomerNames(keyword.trim());
    }
}
