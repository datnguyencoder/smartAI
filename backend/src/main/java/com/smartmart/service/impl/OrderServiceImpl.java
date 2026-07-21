package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreateOrderRequest;
import com.smartmart.dto.request.OrderLineRequest;
import com.smartmart.dto.request.OrderPaymentRequest;
import com.smartmart.dto.response.OrderItemResponse;
import com.smartmart.dto.response.OrderPrintResponse;
import com.smartmart.dto.response.OrderResponse;
import com.smartmart.dto.response.OrderPaymentResponse;
import com.smartmart.entity.*;
import com.smartmart.enums.InventoryActionType;
import com.smartmart.enums.OrderStatus;
import com.smartmart.enums.PaymentMethod;
import com.smartmart.enums.ReferenceType;
import com.smartmart.event.OrderCreatedEvent;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.ForbiddenException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.*;
import com.smartmart.security.SecurityUtils;
import com.smartmart.entity.Customer;
import com.smartmart.entity.Promotion;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.OrderService;
import com.smartmart.service.CustomerService;
import com.smartmart.service.CustomerDebtService;
import com.smartmart.service.InventoryAlertService;
import com.smartmart.service.InventoryLedgerService;
import com.smartmart.service.ItemService;
import com.smartmart.service.DiscountPlanService;
import com.smartmart.service.PromotionService;
import com.smartmart.service.SettingService;
import com.smartmart.service.ShiftService;
import com.smartmart.util.AuditData;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class OrderServiceImpl implements OrderService {

    private static final String DEFAULT_LOCATION = "Kho bán";

    private final OrderRepository orderRepository;
    private final ItemService itemService;
    private final LocationRepository locationRepository;
    private final InventoryLedgerService inventoryLedgerService;
    private final InventoryLogRepository inventoryLogRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final InventoryAlertService inventoryAlertService;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;
    private final ReturnOrderRepository returnOrderRepository;
    private final CustomerService customerService;
    private final CustomerDebtService customerDebtService;
    private final PromotionService promotionService;
    private final DiscountPlanService discountPlanService;
    private final ShiftService shiftService;
    private final SettingService settingService;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            ItemService itemService,
            LocationRepository locationRepository,
            InventoryLedgerService inventoryLedgerService,
            InventoryLogRepository inventoryLogRepository,
            ApplicationEventPublisher eventPublisher,
            InventoryAlertService inventoryAlertService,
            AuditLogService auditLogService,
            UserRepository userRepository,
            ReturnOrderRepository returnOrderRepository,
            CustomerService customerService,
            CustomerDebtService customerDebtService,
            PromotionService promotionService,
            DiscountPlanService discountPlanService,
            ShiftService shiftService,
            SettingService settingService) {
        this.orderRepository = orderRepository;
        this.itemService = itemService;
        this.locationRepository = locationRepository;
        this.inventoryLedgerService = inventoryLedgerService;
        this.inventoryLogRepository = inventoryLogRepository;
        this.eventPublisher = eventPublisher;
        this.inventoryAlertService = inventoryAlertService;
        this.auditLogService = auditLogService;
        this.userRepository = userRepository;
        this.returnOrderRepository = returnOrderRepository;
        this.customerService = customerService;
        this.customerDebtService = customerDebtService;
        this.promotionService = promotionService;
        this.discountPlanService = discountPlanService;
        this.shiftService = shiftService;
        this.settingService = settingService;
    }
    // POS: tạo hóa đơn, FEFO trừ tồn, publish event cảnh báo tồn
    @Override
    @CacheEvict(value = { "items", "itemsPage", "dashboardSummary", "dashboardRevenue" }, allEntries = true)
    public OrderResponse create(CreateOrderRequest request) {
        Location location = locationRepository.findByLocationName(DEFAULT_LOCATION)
                .orElseGet(() -> locationRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new BadRequestException(
                                "Hệ thống chưa có bất kỳ kho nào. Vui lòng tạo kho trước khi bán hàng.")));

        Long userId = SecurityUtils.getCurrentUserId().orElse(null);
        String orderCode = "HD-" + System.currentTimeMillis();

        String customerName = request.getCustomerName() != null ? request.getCustomerName() : "Khách lẻ";
        Customer customer = customerService.findOrCreateByPhone(request.getCustomerPhone(), customerName);
        if (customer != null) {
            customerName = customer.getFullName();
        }
        if (request.getPaymentMethod() == PaymentMethod.PAY_LATER && customer == null) {
            throw new BadRequestException("Cần SĐT khách hàng hợp lệ để bán ghi nợ");
        }

        Order order = Order.builder()
                .orderCode(orderCode)
                .createdBy(userId)
                .customerName(customerName)
                .customer(customer)
                .customerPhone(request.getCustomerPhone())
                .orderDate(LocalDateTime.now())
                .status(OrderStatus.COMPLETED)
                .paymentMethod(request.getPaymentMethod())
                .loyaltyPointsRedeemed(
                        request.getLoyaltyPointsRedeemed() != null ? request.getLoyaltyPointsRedeemed() : 0)
                .note(request.getNote())
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.ZERO)
                .build();

        shiftService.getOpenShiftForCurrentUser().ifPresent(order::setShift);

        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderLineRequest line : request.getItems()) {
            Item item = itemService.findItem(line.getItemId());
            if (!item.isActive()) {
                throw new BadRequestException("Sản phẩm không hoạt động: " + item.getItemName());
            }

            List<InventoryLedgerService.LotAllocation> allocations = inventoryLedgerService.allocateFefo(item, location,
                    line.getQuantity());
            Category categoryAtSale = item.getCategory();

            for (InventoryLedgerService.LotAllocation alloc : allocations) {
                inventoryLedgerService.applyMovement(
                        item, location, alloc.lot(),
                        alloc.quantity().negate(),
                        InventoryActionType.SALE,
                        ReferenceType.ORDER,
                        null,
                        userId,
                        "POS bán hàng");

                BigDecimal subtotal = item.getSellingPrice().multiply(alloc.quantity());
                OrderItem oi = OrderItem.builder()
                        .order(order)
                        .item(item)
                        .lot(alloc.lot())
                        .location(location)
                        .quantity(alloc.quantity())
                        .unitPrice(item.getSellingPrice())
                        .subtotal(subtotal)
                        .categoryIdAtSale(categoryAtSale != null ? categoryAtSale.getId() : null)
                        .categoryNameAtSale(categoryAtSale != null ? categoryAtSale.getCategoryName() : null)
                        .build();
                orderItems.add(oi);
                total = total.add(subtotal);
            }
        }

        BigDecimal planDiscountAmount = BigDecimal.ZERO;
        for (OrderLineRequest line : request.getItems()) {
            var apply = discountPlanService.applyForItem(line.getItemId());
            Item lineItem = itemService.findItem(line.getItemId());
            if (apply.getDealType() == com.smartmart.enums.DiscountDealType.BOGO
                    && apply.getBuyQuantity() != null && apply.getFreeQuantity() != null) {
                BigDecimal freeUnits = computeBogoFreeUnits(line.getQuantity(), apply.getBuyQuantity(), apply.getFreeQuantity());
                planDiscountAmount = planDiscountAmount.add(lineItem.getSellingPrice().multiply(freeUnits));
            } else if (apply.getDiscountPercent() != null && apply.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal lineSubtotal = lineItem.getSellingPrice().multiply(line.getQuantity());
                planDiscountAmount = planDiscountAmount.add(
                        lineSubtotal.multiply(apply.getDiscountPercent()).divide(BigDecimal.valueOf(100)));
            }
        }
        planDiscountAmount = planDiscountAmount.add(resolveGiftWithPurchaseDiscount(request.getItems()));

        BigDecimal discountAmount = planDiscountAmount;
        Promotion promotion = null;
        if (request.getPromotionCode() != null && !request.getPromotionCode().isBlank()) {
            promotion = promotionService.applyCode(request.getPromotionCode(), total);
            discountAmount = discountAmount.add(promotionService.calculateDiscount(promotion, total));
        }

        int loyaltyRedeemed = request.getLoyaltyPointsRedeemed() != null ? request.getLoyaltyPointsRedeemed() : 0;
        if (loyaltyRedeemed > 0
                && (customer == null || request.getCustomerPhone() == null || request.getCustomerPhone().isBlank())) {
            throw new BadRequestException("Cần SĐT khách hàng hợp lệ để đổi điểm tích lũy");
        }
        if (loyaltyRedeemed > 0 && customer != null) {
            BigDecimal loyaltyDiscount = customerService.redeemPoints(customer.getId(), loyaltyRedeemed);
            discountAmount = discountAmount.add(loyaltyDiscount);
        }

        order.setPromotion(promotion);
        order.setDiscountAmount(discountAmount);
        order.setTotalAmount(total.subtract(discountAmount).max(BigDecimal.ZERO));
        order.getItems().addAll(orderItems);

        if (request.getPaymentMethod() == PaymentMethod.PAY_LATER) {
            // Công nợ khách được tạo sau khi order lưu thành công, không ghi nhận payment
            // thu tiền ngay.
        } else if (request.getPayments() != null && !request.getPayments().isEmpty()) {
            BigDecimal paymentSum = request.getPayments().stream()
                    .map(p -> p.getAmount())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (paymentSum.compareTo(order.getTotalAmount()) < 0) {
                throw new BadRequestException(
                        "Số tiền thanh toán (" + paymentSum + ") không đủ so với tổng đơn: " + order.getTotalAmount()
                                + ". Với tiền mặt, khách được thối lại phần dư.");
            }
            for (OrderPaymentRequest pay : request.getPayments()) {
                order.getPayments().add(OrderPayment.builder()
                        .order(order)
                        .paymentMethod(pay.getPaymentMethod())
                        .amount(pay.getAmount())
                        .createdAt(LocalDateTime.now())
                        .build());
            }
        } else if (request.getPaymentMethod() != null) {
            order.getPayments().add(OrderPayment.builder()
                    .order(order)
                    .paymentMethod(request.getPaymentMethod())
                    .amount(order.getTotalAmount())
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        LocalDateTime movementStart = LocalDateTime.now().minusSeconds(5);
        Order saved = orderRepository.save(order);

        if (request.getPaymentMethod() == PaymentMethod.PAY_LATER && customer != null) {
            customerDebtService.createFromOrder(saved, customer);
        }

        int loyaltyPointsEarned = 0;
        if (saved.getStatus() == OrderStatus.COMPLETED && customer != null) {
            loyaltyPointsEarned = customerService.awardPoints(customer.getId(), saved.getTotalAmount());
        }

        // Backfill referenceId on inventory logs created during this transaction
        List<Long> itemIds = saved.getItems().stream().map(oi -> oi.getItem().getId()).distinct().toList();
        if (!itemIds.isEmpty() && userId != null) {
            inventoryLogRepository.backfillSaleReferenceId(saved.getId(), itemIds, userId, movementStart);
        }

        // SALE-04: chỉ gửi Kafka sau khi transaction commit — xem OrderEventPublisher.onOrderCreated
        eventPublisher.publishEvent(new OrderCreatedEvent(this, saved.getId(), saved.getOrderCode()));
        saved.getItems().forEach(oi -> inventoryAlertService.evaluateStockAfterSale(oi.getItem().getId()));
        auditLogService.log(
                AuditAction.ORDER_CREATE,
                "ORDER",
                saved.getId().toString(),
                "Tạo hóa đơn: " + saved.getOrderCode(),
                null,
                AuditData.of(
                        "orderCode", saved.getOrderCode(),
                        "customerName", saved.getCustomerName(),
                        "paymentMethod", saved.getPaymentMethod(),
                        "discountAmount", saved.getDiscountAmount(),
                        "totalAmount", saved.getTotalAmount(),
                        "status", saved.getStatus()));

        return toResponse(saved, loyaltyPointsEarned);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> listAll() {
        boolean staffOnly = SecurityUtils.hasRole("STAFF")
                && !SecurityUtils.hasAnyRole("ADMIN", "MANAGER");
        if (staffOnly) {
            Long userId = SecurityUtils.getCurrentUserId()
                    .orElseThrow(() -> new ForbiddenException("Không xác định được người dùng"));
            return orderRepository.findByCreatedByWithItems(userId).stream().map(this::toResponse).toList();
        }
        return orderRepository.findAllWithItems().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<OrderResponse> listPaged(int page, int size, String search,
            OrderStatus status, java.time.LocalDateTime fromDate, java.time.LocalDateTime toDate) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size,
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"));
        String keyword = (search != null && !search.trim().isEmpty()) ? search.trim().toLowerCase() : null;

        org.springframework.data.jpa.domain.Specification<Order> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (keyword != null) {
                String pattern = "%" + keyword + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("orderCode")), pattern),
                        cb.like(cb.lower(root.get("customerName")), pattern)
                ));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("orderDate"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("orderDate"), toDate));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        org.springframework.data.domain.Page<Order> orderPage = orderRepository.findAll(spec, pageable);
        return orderPage.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getById(Long id) {
        Order order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hóa đơn"));
        assertStaffCanAccessOrder(order);
        return toResponse(order);
    }

    private void assertStaffCanAccessOrder(Order order) {
        boolean staffOnly = SecurityUtils.hasRole("STAFF")
                && !SecurityUtils.hasAnyRole("ADMIN", "MANAGER");
        if (!staffOnly) {
            return;
        }
        Long userId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new ForbiddenException("Không xác định được người dùng"));
        if (order.getCreatedBy() == null || !order.getCreatedBy().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền xem hóa đơn này");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public OrderPrintResponse getPrint(Long id) {
        Order order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hóa đơn"));
        assertStaffCanAccessOrder(order);

        String staffName = "Nhân viên";
        if (order.getCreatedBy() != null) {
            staffName = userRepository.findById(order.getCreatedBy())
                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername())
                    .orElse(staffName);
        }

        List<OrderPrintResponse.PrintLine> lines = order.getItems().stream()
                .map(i -> OrderPrintResponse.PrintLine.builder()
                        .itemCode(i.getItem().getItemCode())
                        .itemName(i.getItem().getItemName())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .lineTotal(i.getSubtotal())
                        .build())
                .toList();

        List<OrderPrintResponse.PaymentLine> paymentLines = order.getPayments() != null
                && !order.getPayments().isEmpty()
                        ? order.getPayments().stream()
                                .map(p -> OrderPrintResponse.PaymentLine.builder()
                                        .paymentMethod(
                                                p.getPaymentMethod() != null ? p.getPaymentMethod().name() : "CASH")
                                        .amount(p.getAmount())
                                        .build())
                                .toList()
                        : List.of(OrderPrintResponse.PaymentLine.builder()
                                .paymentMethod(
                                        order.getPaymentMethod() != null ? order.getPaymentMethod().name() : "CASH")
                                .amount(order.getTotalAmount())
                                .build());

        BigDecimal subtotal = order.getItems().stream()
                .map(i -> i.getSubtotal() != null ? i.getSubtotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal discount = order.getDiscountAmount() != null ? order.getDiscountAmount()
                : BigDecimal.ZERO;

        // VAT-inclusive: vatAmount = total * vatRate / (1 + vatRate). Default 0 (no VAT
        // shown).
        BigDecimal vatRateVal;
        try {
            vatRateVal = new BigDecimal(settingService.getValue("vat_rate", "0"));
        } catch (NumberFormatException e) {
            vatRateVal = BigDecimal.ZERO;
        }
        BigDecimal vatAmount = vatRateVal.compareTo(BigDecimal.ZERO) > 0
                ? order.getTotalAmount()
                        .multiply(vatRateVal)
                        .divide(BigDecimal.ONE.add(vatRateVal), 0, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return OrderPrintResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .orderDate(order.getOrderDate())
                .staffName(staffName)
                .subtotalAmount(subtotal)
                .discountAmount(discount)
                .vatAmount(vatAmount)
                .vatRate(vatRateVal)
                .totalAmount(order.getTotalAmount())
                .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : "CASH")
                .promotionCode(order.getPromotion() != null ? order.getPromotion().getCode() : null)
                .loyaltyPointsRedeemed(order.getLoyaltyPointsRedeemed())
                .shiftId(order.getShift() != null ? order.getShift().getId() : null)
                .storeName(settingService.getValue("store_name", "SMARTMART AI"))
                .storeAddress(settingService.getValue("store_address", "TP. Hồ Chí Minh"))
                .storePhone(settingService.getValue("store_phone", ""))
                .receiptFooter(settingService.getValue("receipt_footer", "Cảm ơn quý khách và hẹn gặp lại"))
                .paperWidth(settingService.getValue("receipt_paper_width", "80mm"))
                .payments(paymentLines)
                .items(lines)
                .build();
    }

    @Override
    @CacheEvict(value = { "items", "itemsPage", "dashboardSummary", "dashboardRevenue" }, allEntries = true)
    public OrderResponse cancel(Long id) {
        Order order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hóa đơn"));
        String beforeData = AuditData.of(
                "status", order.getStatus());
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.COMPLETED) {
            throw new BadRequestException("Hóa đơn ở trạng thái này không thể hủy");
        }
        if (returnOrderRepository.existsByOriginalOrderId(order.getId())) {
            throw new BadRequestException("Hóa đơn đã phát sinh trả hàng, không thể hủy trực tiếp");
        }
        Location fallbackLocation = locationRepository.findByLocationName(DEFAULT_LOCATION)
                .orElseGet(() -> locationRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new BadRequestException("Hệ thống chưa có bất kỳ kho nào.")));
        Long userId = SecurityUtils.getCurrentUserId().orElse(null);

        for (OrderItem line : order.getItems()) {
            Location restoreLocation = line.getLocation() != null ? line.getLocation() : fallbackLocation;
            inventoryLedgerService.applyMovement(
                    line.getItem(), restoreLocation, line.getLot(),
                    line.getQuantity(),
                    InventoryActionType.SALE_CANCEL,
                    ReferenceType.ORDER,
                    order.getId(),
                    userId,
                    "Hủy hóa đơn");
        }
        order.setStatus(OrderStatus.CANCELLED);
        Order saved = orderRepository.save(order);

        auditLogService.log(
                AuditAction.ORDER_CANCEL,
                "ORDER",
                saved.getId().toString(),
                "Hủy hóa đơn: " + saved.getOrderCode(),
                beforeData,
                AuditData.of("status", saved.getStatus()));

        return toResponse(saved);
    }

    private OrderResponse toResponse(Order order) {
        return toResponse(order, null);
    }

    private OrderResponse toResponse(Order order, Integer loyaltyPointsEarned) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(i -> OrderItemResponse.builder()
                        .itemId(i.getItem().getId())
                        .itemName(i.getItem().getItemName())
                        .lotId(i.getLot() != null ? i.getLot().getId() : null)
                        .lotNumber(i.getLot() != null ? i.getLot().getLotNumber() : null)
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

        BigDecimal subtotalBeforeDiscount = order.getItems().stream()
                .map(i -> i.getSubtotal() != null ? i.getSubtotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .subtotalBeforeDiscount(subtotalBeforeDiscount)
                .discountAmount(order.getDiscountAmount())
                .promotionCode(order.getPromotion() != null ? order.getPromotion().getCode() : null)
                .cashierName(cashierName)
                .orderDate(order.getOrderDate())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .paymentMethod(order.getPaymentMethod())
                .loyaltyPointsRedeemed(order.getLoyaltyPointsRedeemed())
                .loyaltyPointsEarned(loyaltyPointsEarned)
                .customerLoyaltyPoints(order.getCustomer() != null ? order.getCustomer().getLoyaltyPoints() : null)
                .customerTier(order.getCustomer() != null ? order.getCustomer().getTier() : null)
                .payments(order.getPayments().stream()
                        .map(p -> OrderPaymentResponse.builder()
                                .paymentMethod(p.getPaymentMethod())
                                .amount(p.getAmount())
                                .build())
                        .toList())
                .items(items)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> listByCustomerPhone(String customerPhone) {
        if (customerPhone == null || customerPhone.isBlank()) {
            return List.of();
        }
        String normalized = customerPhone.replaceAll("[^0-9+]", "").trim();
        return orderRepository.findByCustomerPhoneWithItems(normalized).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> suggestCustomers(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        return orderRepository.suggestCustomerNames(keyword.trim());
    }

    /** For a BOGO plan (buy N get M free), returns how many units in {@code quantity} are free. */
    private BigDecimal computeBogoFreeUnits(BigDecimal quantity, int buyQuantity, int freeQuantity) {
        long qty = quantity.longValue();
        long groupSize = buyQuantity + freeQuantity;
        if (groupSize <= 0 || qty <= 0) {
            return BigDecimal.ZERO;
        }
        long fullGroups = qty / groupSize;
        long remainder = qty % groupSize;
        long free = fullGroups * freeQuantity;
        if (remainder > buyQuantity) {
            free += remainder - buyQuantity;
        }
        return BigDecimal.valueOf(free);
    }

    /**
     * Tính tiền giảm cho các plan BOGO "tặng sản phẩm KHÁC" (vd: mua nước tăng lực tặng móc khóa).
     * Khác với BOGO tặng chính sản phẩm (tính per-line ở trên), loại này cần đối chiếu TOÀN BỘ giỏ:
     * đã mua đủ số lượng sản phẩm/danh mục kích hoạt (trigger) chưa, VÀ quà tặng có thực sự nằm
     * trong giỏ hàng không (thu ngân phải tự quét/thêm quà vào giỏ — hệ thống không tự động thêm
     * dòng hàng mới mà chỉ định giá 0đ cho phần quà nếu điều kiện thoả).
     */
    private BigDecimal resolveGiftWithPurchaseDiscount(List<OrderLineRequest> lines) {
        var giftPlans = discountPlanService.listActiveToday().stream()
                .filter(p -> p.getDealType() == com.smartmart.enums.DiscountDealType.BOGO
                        && p.getGiftItemId() != null
                        && p.getBuyQuantity() != null && p.getFreeQuantity() != null)
                .toList();
        if (giftPlans.isEmpty()) {
            return BigDecimal.ZERO;
        }

        java.util.Map<Long, Item> itemCache = new java.util.HashMap<>();
        java.util.Map<Long, BigDecimal> qtyByItem = new java.util.HashMap<>();
        for (OrderLineRequest line : lines) {
            qtyByItem.merge(line.getItemId(), line.getQuantity(), BigDecimal::add);
        }

        BigDecimal total = BigDecimal.ZERO;
        for (var plan : giftPlans) {
            BigDecimal triggerQty = BigDecimal.ZERO;
            for (var entry : qtyByItem.entrySet()) {
                Item item = itemCache.computeIfAbsent(entry.getKey(), itemService::findItem);
                boolean matches = plan.getPlanType() == com.smartmart.enums.DiscountPlanType.SKU
                        ? plan.getItemId() != null && plan.getItemId().equals(item.getId())
                        : plan.getCategoryId() != null && item.getCategory() != null
                                && plan.getCategoryId().equals(item.getCategory().getId());
                if (matches) {
                    triggerQty = triggerQty.add(entry.getValue());
                }
            }
            if (triggerQty.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            BigDecimal giftQtyInCart = qtyByItem.getOrDefault(plan.getGiftItemId(), BigDecimal.ZERO);
            if (giftQtyInCart.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            long groups = triggerQty.longValue() / plan.getBuyQuantity();
            BigDecimal earnedFree = BigDecimal.valueOf(groups * plan.getFreeQuantity());
            BigDecimal actualFree = earnedFree.min(giftQtyInCart);
            if (actualFree.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            Item giftItem = itemCache.computeIfAbsent(plan.getGiftItemId(), itemService::findItem);
            total = total.add(giftItem.getSellingPrice().multiply(actualFree));
        }
        return total;
    }
}
