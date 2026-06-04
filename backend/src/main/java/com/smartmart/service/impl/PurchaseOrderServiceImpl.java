package com.smartmart.service.impl;

import com.smartmart.dto.request.CreatePurchaseOrderRequest;
import com.smartmart.dto.request.PurchaseLineRequest;
import com.smartmart.dto.request.ReceiveLineRequest;
import com.smartmart.dto.request.ReceivePurchaseRequest;
import com.smartmart.dto.response.PurchaseOrderItemResponse;
import com.smartmart.dto.response.PurchaseOrderResponse;
import com.smartmart.entity.*;
import com.smartmart.enums.InventoryActionType;
import com.smartmart.enums.PurchaseStatus;
import com.smartmart.enums.ReferenceType;
import com.smartmart.event.PurchaseEventPublisher;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.ExpiryDateRequiredException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.exception.SupplierInactiveException;
import com.smartmart.repository.LocationRepository;
import com.smartmart.repository.PurchaseOrderRepository;
import com.smartmart.repository.SupplierRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.InventoryLedgerService;
import com.smartmart.service.ItemService;
import com.smartmart.service.PurchaseOrderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final LocationRepository locationRepository;
    private final ItemService itemService;
    private final InventoryLedgerService inventoryLedgerService;
    private final PurchaseEventPublisher purchaseEventPublisher;
    private final AuditLogService auditLogService;

    public PurchaseOrderServiceImpl(
            PurchaseOrderRepository purchaseOrderRepository,
            SupplierRepository supplierRepository,
            LocationRepository locationRepository,
            ItemService itemService,
            InventoryLedgerService inventoryLedgerService,
            PurchaseEventPublisher purchaseEventPublisher,
            AuditLogService auditLogService
    ) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.supplierRepository = supplierRepository;
        this.locationRepository = locationRepository;
        this.itemService = itemService;
        this.inventoryLedgerService = inventoryLedgerService;
        this.purchaseEventPublisher = purchaseEventPublisher;
        this.auditLogService = auditLogService;
    }

    @Override
    public PurchaseOrderResponse create(CreatePurchaseOrderRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhà cung cấp"));
        if (!supplier.isActive()) {
            throw new SupplierInactiveException();
        }
        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy kho"));

        PurchaseOrder po = PurchaseOrder.builder()
                .supplier(supplier)
                .location(location)
                .createdBy(SecurityUtils.getCurrentUserId().orElse(null))
                .status(PurchaseStatus.PENDING)
                .purchaseDate(LocalDateTime.now())
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (PurchaseLineRequest line : request.getItems()) {
            Item item = itemService.findItem(line.getItemId());
            BigDecimal subtotal = line.getUnitPrice().multiply(line.getOrderedQty());
            PurchaseOrderItem poi = PurchaseOrderItem.builder()
                    .purchaseOrder(po)
                    .item(item)
                    .orderedQty(line.getOrderedQty())
                    .receivedQty(BigDecimal.ZERO)
                    .unitPrice(line.getUnitPrice())
                    .subtotal(subtotal)
                    .build();
            po.getItems().add(poi);
            total = total.add(subtotal);
        }
        po.setTotalAmount(total);
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        return toResponse(purchaseOrderRepository.findByIdWithDetails(saved.getId()).orElse(saved));
    }

    @Override
    public PurchaseOrderResponse receive(Long purchaseId, ReceivePurchaseRequest request) {
        PurchaseOrder po = purchaseOrderRepository.findByIdWithDetails(purchaseId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu nhập"));
        if (po.getStatus() == PurchaseStatus.CANCELLED || po.getStatus() == PurchaseStatus.COMPLETED) {
            throw new BadRequestException("Phiếu nhập không thể nhận thêm hàng");
        }

        UUID userId = SecurityUtils.getCurrentUserId().orElse(null);
        boolean anyReceived = false;

        for (ReceiveLineRequest rl : request.getLines()) {
            PurchaseOrderItem poi = po.getItems().stream()
                    .filter(i -> i.getId().equals(rl.getPurchaseItemId()))
                    .findFirst()
                    .orElseThrow(() -> new NotFoundException("Dòng phiếu nhập không tồn tại"));

            BigDecimal remaining = poi.getOrderedQty().subtract(poi.getReceivedQty());
            if (rl.getReceiveQty().compareTo(remaining) > 0) {
                throw new BadRequestException("Số lượng nhận vượt quá đặt hàng");
            }

            Item item = poi.getItem();
            if (item.isHasExpiry() && rl.getExpiryDate() == null) {
                throw new ExpiryDateRequiredException();
            }

            String lotNum = rl.getLotNumber() != null ? rl.getLotNumber() : "LOT-" + purchaseId + "-" + poi.getId();
            ItemLot lot = item.isHasExpiry() || rl.getExpiryDate() != null
                    ? inventoryLedgerService.getOrCreateLot(item, lotNum, rl.getExpiryDate())
                    : null;

            inventoryLedgerService.applyMovement(
                    item, po.getLocation(), lot,
                    rl.getReceiveQty(),
                    InventoryActionType.PURCHASE_RECEIVE,
                    ReferenceType.PURCHASE_ORDER,
                    po.getId(),
                    userId,
                    "Nhập kho"
            );

            poi.setReceivedQty(poi.getReceivedQty().add(rl.getReceiveQty()));
            poi.setLot(lot);
            anyReceived = true;
        }

        if (!anyReceived) {
            throw new BadRequestException("Không có dòng nhập hợp lệ");
        }

        boolean allDone = po.getItems().stream()
                .allMatch(i -> i.getReceivedQty().compareTo(i.getOrderedQty()) >= 0);
        po.setStatus(allDone ? PurchaseStatus.COMPLETED : PurchaseStatus.PARTIALLY_RECEIVED);
        if (allDone) {
            po.setCompletedAt(LocalDateTime.now());
        }

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        purchaseEventPublisher.publishPurchaseReceived(saved.getId());
        auditLogService.log("PURCHASE_RECEIVE", "Nhận hàng phiếu #" + saved.getId());
        return toResponse(purchaseOrderRepository.findByIdWithDetails(saved.getId()).orElse(saved));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> listAll() {
        return purchaseOrderRepository.findAllWithDetails().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseOrderResponse getById(Long id) {
        return purchaseOrderRepository.findByIdWithDetails(id)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu nhập"));
    }

    @Override
    public PurchaseOrderResponse cancel(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu nhập"));
        if (po.getStatus() == PurchaseStatus.CANCELLED) {
            throw new BadRequestException("Phiếu nhập đã hủy");
        }
        boolean hasReceived = po.getItems().stream()
                .anyMatch(i -> i.getReceivedQty().compareTo(BigDecimal.ZERO) > 0);
        if (hasReceived) {
            throw new BadRequestException("Không thể hủy phiếu đã nhận hàng");
        }
        po.setStatus(PurchaseStatus.CANCELLED);
        return toResponse(purchaseOrderRepository.save(po));
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder po) {
        List<PurchaseOrderItemResponse> items = po.getItems().stream()
                .map(i -> PurchaseOrderItemResponse.builder()
                        .id(i.getId())
                        .itemId(i.getItem().getId())
                        .itemName(i.getItem().getItemName())
                        .orderedQty(i.getOrderedQty())
                        .receivedQty(i.getReceivedQty())
                        .unitPrice(i.getUnitPrice())
                        .subtotal(i.getSubtotal())
                        .build())
                .toList();
        return PurchaseOrderResponse.builder()
                .id(po.getId())
                .supplierId(po.getSupplier().getId())
                .supplierName(po.getSupplier().getSupplierName())
                .locationId(po.getLocation().getId())
                .locationName(po.getLocation().getLocationName())
                .status(po.getStatus())
                .purchaseDate(po.getPurchaseDate())
                .completedAt(po.getCompletedAt())
                .totalAmount(po.getTotalAmount())
                .items(items)
                .build();
    }
}
