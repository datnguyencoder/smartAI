package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreateStockTransferOrderRequest;
import com.smartmart.dto.request.StockTransferLineRequest;
import com.smartmart.dto.response.StockTransferOrderItemResponse;
import com.smartmart.dto.response.StockTransferOrderResponse;
import com.smartmart.entity.*;
import com.smartmart.enums.InventoryActionType;
import com.smartmart.enums.ReferenceType;
import com.smartmart.enums.StockTransferOrderStatus;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.ItemLotRepository;
import com.smartmart.repository.LocationRepository;
import com.smartmart.repository.StockTransferOrderRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.InventoryLedgerService;
import com.smartmart.service.ItemService;
import com.smartmart.service.StockTransferOrderService;
import com.smartmart.util.AuditData;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class StockTransferOrderServiceImpl implements StockTransferOrderService {

    private final StockTransferOrderRepository stockTransferOrderRepository;
    private final LocationRepository locationRepository;
    private final ItemService itemService;
    private final ItemLotRepository itemLotRepository;
    private final InventoryLedgerService inventoryLedgerService;
    private final AuditLogService auditLogService;

    public StockTransferOrderServiceImpl(
            StockTransferOrderRepository stockTransferOrderRepository,
            LocationRepository locationRepository,
            ItemService itemService,
            ItemLotRepository itemLotRepository,
            InventoryLedgerService inventoryLedgerService,
            AuditLogService auditLogService) {
        this.stockTransferOrderRepository = stockTransferOrderRepository;
        this.locationRepository = locationRepository;
        this.itemService = itemService;
        this.itemLotRepository = itemLotRepository;
        this.inventoryLedgerService = inventoryLedgerService;
        this.auditLogService = auditLogService;
    }

    @Override
    public StockTransferOrderResponse create(CreateStockTransferOrderRequest request) {
        if (request.getFromLocationId().equals(request.getToLocationId())) {
            throw new BadRequestException("Kho nguồn và kho đích phải khác nhau");
        }
        Location fromLocation = findActiveLocation(request.getFromLocationId());
        Location toLocation = findActiveLocation(request.getToLocationId());

        StockTransferOrder order = StockTransferOrder.builder()
                .transferCode("STO-" + System.currentTimeMillis())
                .fromLocation(fromLocation)
                .toLocation(toLocation)
                .status(StockTransferOrderStatus.DRAFT)
                .createdBy(SecurityUtils.getCurrentUserId().orElse(null))
                .note(blankToNull(request.getNote()))
                .build();

        for (StockTransferLineRequest line : request.getItems()) {
            Item item = itemService.findItem(line.getItemId());
            ItemLot lot = findLot(line.getLotId());
            order.getItems().add(StockTransferOrderItem.builder()
                    .transferOrder(order)
                    .item(item)
                    .lot(lot)
                    .quantity(line.getQuantity())
                    .build());
        }

        StockTransferOrder saved = stockTransferOrderRepository.save(order);
        auditLogService.log(AuditAction.STOCK_TRANSFER_CREATE, "STOCK_TRANSFER_ORDER",
                saved.getId().toString(), "Tạo phiếu điều chuyển " + saved.getTransferCode(),
                null, AuditData.of("status", saved.getStatus()));
        return toResponse(saved);
    }

    @Override
    @CacheEvict(value = {"items", "itemsPage", "dashboardSummary"}, allEntries = true)
    public StockTransferOrderResponse confirm(Long id) {
        StockTransferOrder order = findWithDetails(id);
        if (order.getStatus() != StockTransferOrderStatus.DRAFT
                && order.getStatus() != StockTransferOrderStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể xác nhận phiếu ở trạng thái DRAFT hoặc PENDING");
        }

        Long userId = SecurityUtils.getCurrentUserId().orElse(null);
        String note = order.getNote() != null ? order.getNote() : "Điều chuyển kho";

        for (StockTransferOrderItem line : order.getItems()) {
            inventoryLedgerService.applyMovement(
                    line.getItem(), order.getFromLocation(), line.getLot(),
                    line.getQuantity().negate(),
                    InventoryActionType.TRANSFER_OUT,
                    ReferenceType.STOCK_TRANSFER_ORDER,
                    order.getId(), userId, note);
            inventoryLedgerService.applyMovement(
                    line.getItem(), order.getToLocation(), line.getLot(),
                    line.getQuantity(),
                    InventoryActionType.TRANSFER_IN,
                    ReferenceType.STOCK_TRANSFER_ORDER,
                    order.getId(), userId, note);
        }

        String before = AuditData.of("status", order.getStatus());
        order.setStatus(StockTransferOrderStatus.COMPLETED);
        order.setConfirmedAt(LocalDateTime.now());
        stockTransferOrderRepository.save(order);

        auditLogService.log(AuditAction.STOCK_TRANSFER_CONFIRM, "STOCK_TRANSFER_ORDER",
                order.getId().toString(), "Xác nhận điều chuyển " + order.getTransferCode(),
                before, AuditData.of("status", order.getStatus()));
        return toResponse(order);
    }

    @Override
    public StockTransferOrderResponse cancel(Long id) {
        StockTransferOrder order = findWithDetails(id);
        if (order.getStatus() == StockTransferOrderStatus.COMPLETED
                || order.getStatus() == StockTransferOrderStatus.CANCELLED) {
            throw new BadRequestException("Không thể hủy phiếu điều chuyển ở trạng thái hiện tại");
        }
        String before = AuditData.of("status", order.getStatus());
        order.setStatus(StockTransferOrderStatus.CANCELLED);
        stockTransferOrderRepository.save(order);
        auditLogService.log(AuditAction.STOCK_TRANSFER_CANCEL, "STOCK_TRANSFER_ORDER",
                order.getId().toString(), "Hủy điều chuyển " + order.getTransferCode(),
                before, AuditData.of("status", order.getStatus()));
        return toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public StockTransferOrderResponse getById(Long id) {
        return toResponse(findWithDetails(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockTransferOrderResponse> listAll() {
        return stockTransferOrderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse).toList();
    }

    private StockTransferOrder findWithDetails(Long id) {
        return stockTransferOrderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu điều chuyển: " + id));
    }

    private Location findActiveLocation(Long id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy vị trí kho: " + id));
        if (!location.isActive()) {
            throw new BadRequestException("Vị trí kho không hoạt động: " + location.getLocationName());
        }
        return location;
    }

    private ItemLot findLot(Long id) {
        if (id == null) return null;
        return itemLotRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy lô hàng: " + id));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private StockTransferOrderResponse toResponse(StockTransferOrder order) {
        List<StockTransferOrderItemResponse> items = order.getItems().stream()
                .map(i -> StockTransferOrderItemResponse.builder()
                        .id(i.getId())
                        .itemId(i.getItem().getId())
                        .itemName(i.getItem().getItemName())
                        .lotId(i.getLot() != null ? i.getLot().getId() : null)
                        .lotNumber(i.getLot() != null ? i.getLot().getLotNumber() : null)
                        .quantity(i.getQuantity())
                        .build())
                .toList();

        return StockTransferOrderResponse.builder()
                .id(order.getId())
                .transferCode(order.getTransferCode())
                .fromLocationId(order.getFromLocation().getId())
                .fromLocationName(order.getFromLocation().getLocationName())
                .toLocationId(order.getToLocation().getId())
                .toLocationName(order.getToLocation().getLocationName())
                .status(order.getStatus())
                .note(order.getNote())
                .createdBy(order.getCreatedBy())
                .confirmedAt(order.getConfirmedAt())
                .createdAt(order.getCreatedAt())
                .items(items)
                .build();
    }
}
