package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreateReturnOrderRequest;
import com.smartmart.dto.request.ReturnLineRequest;
import com.smartmart.dto.response.ReturnableOrderItemResponse;
import com.smartmart.entity.*;
import com.smartmart.enums.*;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.ItemLotRepository;
import com.smartmart.repository.LocationRepository;
import com.smartmart.repository.OrderRepository;
import com.smartmart.repository.ReturnOrderItemRepository;
import com.smartmart.repository.ReturnOrderRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.InventoryLedgerService;
import com.smartmart.service.ItemService;
import com.smartmart.service.ReturnOrderService;
import com.smartmart.util.AuditData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ReturnOrderServiceImpl implements ReturnOrderService {

    private static final Logger log = LoggerFactory.getLogger(ReturnOrderServiceImpl.class);
    private static final String DEFAULT_LOCATION = "Kho bán";
    @Value("${app.return-policy.allowed-days:7}")
    private int returnAllowedDays;

    private final ReturnOrderRepository returnOrderRepository;
    private final ReturnOrderItemRepository returnOrderItemRepository;
    private final OrderRepository orderRepository;
    private final ItemLotRepository itemLotRepository;
    private final LocationRepository locationRepository;
    private final ItemService itemService;
    private final InventoryLedgerService inventoryLedgerService;
    private final AuditLogService auditLogService;

    public ReturnOrderServiceImpl(
            ReturnOrderRepository returnOrderRepository,
            ReturnOrderItemRepository returnOrderItemRepository,
            OrderRepository orderRepository,
            ItemLotRepository itemLotRepository,
            LocationRepository locationRepository,
            ItemService itemService,
            InventoryLedgerService inventoryLedgerService,
            AuditLogService auditLogService
    ) {
        this.returnOrderRepository = returnOrderRepository;
        this.returnOrderItemRepository = returnOrderItemRepository;
        this.orderRepository = orderRepository;
        this.itemLotRepository = itemLotRepository;
        this.locationRepository = locationRepository;
        this.itemService = itemService;
        this.inventoryLedgerService = inventoryLedgerService;
        this.auditLogService = auditLogService;
    }

    @Override
    public ReturnOrder create(CreateReturnOrderRequest request) {
        Order original = orderRepository.findByIdWithItems(request.getOriginalOrderId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hóa đơn gốc"));

        validateOriginalOrderReturnable(original);

        Location defaultLocation = locationRepository.findByLocationName(DEFAULT_LOCATION)
                .orElseGet(() -> locationRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new BadRequestException("Hệ thống chưa có kho")));

        Map<String, BigDecimal> soldQty = new HashMap<>();
        Map<String, OrderItem> soldItems = new HashMap<>();
        for (OrderItem oi : original.getItems()) {
            String key = oi.getItem().getId() + "-" + (oi.getLot() != null ? oi.getLot().getId() : "null");
            soldQty.merge(key, oi.getQuantity(), BigDecimal::add);
            soldItems.putIfAbsent(key, oi);
        }

        ReturnOrder returnOrder = ReturnOrder.builder()
                .originalOrder(original)
                .createdBy(SecurityUtils.getCurrentUserId().orElse(null))
                .returnDate(LocalDateTime.now())
                .status(ReturnOrderStatus.COMPLETED)
                .reason(request.getReason())
                .note(request.getNote())
                .refundAmount(BigDecimal.ZERO)
                .build();

        BigDecimal refundTotal = BigDecimal.ZERO;
        BigDecimal discountRatio = calculateDiscountRatio(original);
        Long userId = SecurityUtils.getCurrentUserId().orElse(null);

        for (ReturnLineRequest line : request.getItems()) {
            if (line.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Số lượng trả phải lớn hơn 0");
            }

            Item item = itemService.findItem(line.getItemId());
            ItemLot lot = resolveReturnLot(line, item, soldQty, soldItems);
            String key = item.getId() + "-" + (lot != null ? lot.getId() : "null");

            if (!soldQty.containsKey(key)) {
                throw new BadRequestException("Sản phẩm không có trong hóa đơn gốc: " + item.getItemName());
            }

            OrderItem soldItem = soldItems.get(key);
            BigDecimal maxReturn = soldQty.get(key);
            BigDecimal alreadyReturned = returnOrderItemRepository.sumReturnedQty(
                    original.getId(),
                    item.getId(),
                    lot != null ? lot.getId() : null
            );

            BigDecimal remaining = maxReturn.subtract(alreadyReturned);
            if (remaining.compareTo(BigDecimal.ZERO) < 0) {
                remaining = BigDecimal.ZERO;
            }

            if (line.getQuantity().compareTo(remaining) > 0) {
                throw new BadRequestException(
                        "Số lượng trả vượt quá số còn lại có thể trả: "
                                + item.getItemName()
                                + " (còn " + remaining + ")"
                );
            }

            BigDecimal unitPrice = soldItem.getUnitPrice();
            BigDecimal grossSubtotal = unitPrice.multiply(line.getQuantity());
            BigDecimal subtotal = grossSubtotal
                    .subtract(grossSubtotal.multiply(discountRatio))
                    .max(BigDecimal.ZERO)
                    .setScale(2, RoundingMode.HALF_UP);

            refundTotal = refundTotal.add(subtotal);

            returnOrder.getItems().add(ReturnOrderItem.builder()
                    .returnOrder(returnOrder)
                    .item(item)
                    .lot(lot)
                    .quantity(line.getQuantity())
                    .unitPrice(unitPrice)
                    .subtotal(subtotal)
                    .handlingAction(line.getHandlingAction())
                    .build());
        }

        returnOrder.setRefundAmount(refundTotal);
        ReturnOrder saved = returnOrderRepository.save(returnOrder);

        for (ReturnOrderItem returnedItem : saved.getItems()) {
            if (returnedItem.getHandlingAction() != ReturnHandlingAction.RESTOCK) {
                continue;
            }

            String key = returnedItem.getItem().getId() + "-"
                    + (returnedItem.getLot() != null ? returnedItem.getLot().getId() : "null");

            OrderItem soldItem = soldItems.get(key);
            Location restoreLocation = soldItem != null && soldItem.getLocation() != null
                    ? soldItem.getLocation()
                    : defaultLocation;

            inventoryLedgerService.applyMovement(
                    returnedItem.getItem(),
                    restoreLocation,
                    returnedItem.getLot(),
                    returnedItem.getQuantity(),
                    InventoryActionType.SALE_RETURN,
                    ReferenceType.RETURN_ORDER,
                    saved.getId(),
                    userId,
                    "Trả hàng nhập lại kho từ " + original.getOrderCode()
            );
        }

        long restockLines = saved.getItems().stream()
                .filter(i -> i.getHandlingAction() == ReturnHandlingAction.RESTOCK)
                .count();

        long discardLines = saved.getItems().stream()
                .filter(i -> i.getHandlingAction() == ReturnHandlingAction.DISCARD)
                .count();

        auditLogService.log(
                AuditAction.RETURN_CREATE,
                "RETURN_ORDER",
                saved.getId().toString(),
                "Tạo phiếu trả hàng #" + saved.getId() + " cho " + original.getOrderCode(),
                null,
                AuditData.of(
                        "refundAmount", saved.getRefundAmount(),
                        "originalOrderId", original.getId(),
                        "itemCount", saved.getItems().size(),
                        "restockLines", restockLines,
                        "discardLines", discardLines
                )
        );

        return returnOrderRepository.findWithDetailsById(saved.getId())
                .orElse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ReturnOrder findById(Long id) {
        return returnOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu trả hàng"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReturnOrder> listAll() {
        return returnOrderRepository.findAllWithDetailsOrderByIdDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReturnOrder> listByOriginalOrder(Long originalOrderId) {
        return returnOrderRepository.findByOriginalOrderIdWithDetailsOrderByIdDesc(originalOrderId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReturnableOrderItemResponse> listReturnableItems(Long orderId) {
        Order original = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hóa đơn gốc"));

        validateOriginalOrderReturnable(original);

        BigDecimal discountRatio = calculateDiscountRatio(original);

        return original.getItems().stream()
                .map(orderItem -> {
                    Item item = orderItem.getItem();
                    ItemLot lot = orderItem.getLot();

                    BigDecimal soldQuantity = orderItem.getQuantity();
                    BigDecimal returnedQuantity = returnOrderItemRepository.sumReturnedQty(
                            original.getId(),
                            item.getId(),
                            lot != null ? lot.getId() : null
                    );

                    BigDecimal remainingQuantity = soldQuantity.subtract(returnedQuantity);
                    if (remainingQuantity.compareTo(BigDecimal.ZERO) < 0) {
                        remainingQuantity = BigDecimal.ZERO;
                    }

                    BigDecimal grossRefund = orderItem.getUnitPrice().multiply(remainingQuantity);
                    BigDecimal estimatedRefund = grossRefund
                            .subtract(grossRefund.multiply(discountRatio))
                            .max(BigDecimal.ZERO)
                            .setScale(2, RoundingMode.HALF_UP);

                    return ReturnableOrderItemResponse.builder()
                            .itemId(item.getId())
                            .itemName(item.getItemName())
                            .lotId(lot != null ? lot.getId() : null)
                            .lotNumber(lot != null ? lot.getLotNumber() : null)
                            .soldQuantity(soldQuantity)
                            .returnedQuantity(returnedQuantity)
                            .remainingQuantity(remainingQuantity)
                            .unitPrice(orderItem.getUnitPrice())
                            .estimatedRefund(estimatedRefund)
                            .build();
                })
                .toList();
    }

    /**
     * Resolve lot for return line: explicit lotId, or auto-match when invoice has a single lot for the SKU.
     */
    private ItemLot resolveReturnLot(
            ReturnLineRequest line,
            Item item,
            Map<String, BigDecimal> soldQty,
            Map<String, OrderItem> soldItems
    ) {
        if (line.getLotId() != null) {
            return itemLotRepository.findById(line.getLotId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy lô"));
        }
        String prefix = item.getId() + "-";
        List<String> matchingKeys = soldQty.keySet().stream()
                .filter(k -> k.startsWith(prefix))
                .toList();
        if (matchingKeys.isEmpty()) {
            return null;
        }
        if (matchingKeys.size() == 1) {
            OrderItem soldItem = soldItems.get(matchingKeys.get(0));
            return soldItem != null ? soldItem.getLot() : null;
        }
        throw new BadRequestException(
                "Sản phẩm " + item.getItemName() + " có nhiều lô trên hóa đơn — vui lòng chọn lô khi trả hàng");
    }
    private void validateOriginalOrderReturnable(Order original) {
        if (original.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Không thể trả hàng từ hóa đơn đã hủy");
        }

        if (original.getStatus() != OrderStatus.COMPLETED) {
            throw new BadRequestException("Chỉ có thể trả hàng từ hóa đơn đã hoàn thành");
        }

        LocalDateTime deadline = original.getOrderDate().plusDays(returnAllowedDays);
        if (LocalDateTime.now().isAfter(deadline)) {
            throw new BadRequestException("Đã quá thời hạn " + returnAllowedDays + " ngày để trả hàng");
        }
    }

    private BigDecimal calculateDiscountRatio(Order original) {
        BigDecimal originalSubtotal = original.getItems().stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (originalSubtotal.compareTo(BigDecimal.ZERO) <= 0 || original.getDiscountAmount() == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal discountRatio = original.getDiscountAmount()
                .divide(originalSubtotal, 8, RoundingMode.HALF_UP)
                .min(BigDecimal.ONE)
                .max(BigDecimal.ZERO);

        if (discountRatio.compareTo(new BigDecimal("0.5")) > 0) {
            log.warn("Return order for order#{} has unusually high discountRatio={}", original.getId(), discountRatio);
        }

        return discountRatio;
    }

}
