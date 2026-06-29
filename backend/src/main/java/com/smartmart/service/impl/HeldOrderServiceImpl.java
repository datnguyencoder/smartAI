package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateHeldOrderRequest;
import com.smartmart.dto.request.OrderLineRequest;
import com.smartmart.dto.response.HeldOrderItemResponse;
import com.smartmart.dto.response.HeldOrderResponse;
import com.smartmart.entity.HeldOrder;
import com.smartmart.entity.HeldOrderItem;
import com.smartmart.entity.Item;
import com.smartmart.entity.Shift;
import com.smartmart.enums.HeldOrderStatus;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.HeldOrderRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.HeldOrderService;
import com.smartmart.service.ItemService;
import com.smartmart.service.ShiftService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class HeldOrderServiceImpl implements HeldOrderService {

    private final HeldOrderRepository heldOrderRepository;
    private final ItemService itemService;
    private final ShiftService shiftService;

    public HeldOrderServiceImpl(
            HeldOrderRepository heldOrderRepository,
            ItemService itemService,
            ShiftService shiftService) {
        this.heldOrderRepository = heldOrderRepository;
        this.itemService = itemService;
        this.shiftService = shiftService;
    }

    @Override
    public HeldOrderResponse create(CreateHeldOrderRequest request) {
        Long cashierId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new BadRequestException("Không xác định được người dùng"));
        Shift shift = shiftService.getOpenShiftForCurrentUser().orElse(null);

        HeldOrder heldOrder = HeldOrder.builder()
                .holdCode("HOLD-" + System.currentTimeMillis())
                .cashierId(cashierId)
                .shift(shift)
                .customerName(normalizeCustomerName(request.getCustomerName()))
                .customerPhone(blankToNull(request.getCustomerPhone()))
                .promotionCode(blankToNull(request.getPromotionCode()))
                .loyaltyPointsRedeemed(request.getLoyaltyPointsRedeemed())
                .note(blankToNull(request.getNote()))
                .status(HeldOrderStatus.ACTIVE)
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderLineRequest line : request.getItems()) {
            Item item = itemService.findItem(line.getItemId());
            if (!item.isActive()) {
                throw new BadRequestException("Sản phẩm không hoạt động: " + item.getItemName());
            }
            BigDecimal quantity = line.getQuantity();
            BigDecimal lineTotal = item.getSellingPrice().multiply(quantity);
            heldOrder.getItems().add(HeldOrderItem.builder()
                    .heldOrder(heldOrder)
                    .item(item)
                    .quantity(quantity)
                    .unitPrice(item.getSellingPrice())
                    .subtotal(lineTotal)
                    .build());
            subtotal = subtotal.add(lineTotal);
        }

        heldOrder.setSubtotalAmount(subtotal);
        return toResponse(heldOrderRepository.save(heldOrder));
    }

    @Override
    @Transactional(readOnly = true)
    public List<HeldOrderResponse> listActive() {
        Long cashierId = SecurityUtils.getCurrentUserId().orElse(null);
        List<HeldOrder> orders = cashierId == null
                ? heldOrderRepository.findByStatusOrderByCreatedAtDesc(HeldOrderStatus.ACTIVE)
                : heldOrderRepository.findByCashierIdAndStatusOrderByCreatedAtDesc(cashierId, HeldOrderStatus.ACTIVE);
        return orders.stream().map(this::toResponse).toList();
    }

    @Override
    public HeldOrderResponse restore(Long id) {
        HeldOrder heldOrder = findActive(id);
        heldOrder.setStatus(HeldOrderStatus.RESTORED);
        return toResponse(heldOrderRepository.save(heldOrder));
    }

    @Override
    public HeldOrderResponse cancel(Long id) {
        HeldOrder heldOrder = findActive(id);
        heldOrder.setStatus(HeldOrderStatus.CANCELLED);
        return toResponse(heldOrderRepository.save(heldOrder));
    }

    private HeldOrder findActive(Long id) {
        HeldOrder heldOrder = heldOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn giữ: " + id));
        if (heldOrder.getStatus() != HeldOrderStatus.ACTIVE) {
            throw new BadRequestException("Đơn giữ không còn ở trạng thái ACTIVE");
        }
        return heldOrder;
    }

    private HeldOrderResponse toResponse(HeldOrder heldOrder) {
        return HeldOrderResponse.builder()
                .id(heldOrder.getId())
                .holdCode(heldOrder.getHoldCode())
                .cashierId(heldOrder.getCashierId())
                .shiftId(heldOrder.getShift() != null ? heldOrder.getShift().getId() : null)
                .customerName(heldOrder.getCustomerName())
                .customerPhone(heldOrder.getCustomerPhone())
                .promotionCode(heldOrder.getPromotionCode())
                .loyaltyPointsRedeemed(heldOrder.getLoyaltyPointsRedeemed())
                .subtotalAmount(heldOrder.getSubtotalAmount())
                .note(heldOrder.getNote())
                .status(heldOrder.getStatus())
                .createdAt(heldOrder.getCreatedAt() != null ? heldOrder.getCreatedAt() : LocalDateTime.now())
                .items(heldOrder.getItems().stream().map(item -> HeldOrderItemResponse.builder()
                        .itemId(item.getItem().getId())
                        .itemCode(item.getItem().getItemCode())
                        .itemName(item.getItem().getItemName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getSubtotal())
                        .build()).toList())
                .build();
    }

    private String normalizeCustomerName(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? normalized : "Khách lẻ";
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
