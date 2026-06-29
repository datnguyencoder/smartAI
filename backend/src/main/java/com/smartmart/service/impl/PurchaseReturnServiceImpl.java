package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreatePurchaseReturnRequest;
import com.smartmart.dto.request.PurchaseReturnLineRequest;
import com.smartmart.dto.response.PurchaseReturnItemResponse;
import com.smartmart.dto.response.PurchaseReturnResponse;
import com.smartmart.entity.*;
import com.smartmart.enums.InventoryActionType;
import com.smartmart.enums.PurchaseReturnStatus;
import com.smartmart.enums.ReferenceType;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.ItemLotRepository;
import com.smartmart.repository.LocationRepository;
import com.smartmart.repository.PurchaseOrderRepository;
import com.smartmart.repository.PurchaseReturnOrderRepository;
import com.smartmart.repository.SupplierRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.InventoryLedgerService;
import com.smartmart.service.ItemService;
import com.smartmart.service.PurchaseReturnService;
import com.smartmart.util.AuditData;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class PurchaseReturnServiceImpl implements PurchaseReturnService {

    private final PurchaseReturnOrderRepository purchaseReturnOrderRepository;
    private final SupplierRepository supplierRepository;
    private final LocationRepository locationRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ItemService itemService;
    private final ItemLotRepository itemLotRepository;
    private final InventoryLedgerService inventoryLedgerService;
    private final AuditLogService auditLogService;

    public PurchaseReturnServiceImpl(
            PurchaseReturnOrderRepository purchaseReturnOrderRepository,
            SupplierRepository supplierRepository,
            LocationRepository locationRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            ItemService itemService,
            ItemLotRepository itemLotRepository,
            InventoryLedgerService inventoryLedgerService,
            AuditLogService auditLogService) {
        this.purchaseReturnOrderRepository = purchaseReturnOrderRepository;
        this.supplierRepository = supplierRepository;
        this.locationRepository = locationRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.itemService = itemService;
        this.itemLotRepository = itemLotRepository;
        this.inventoryLedgerService = inventoryLedgerService;
        this.auditLogService = auditLogService;
    }

    @Override
    @CacheEvict(value = {"items", "itemsPage", "dashboardSummary"}, allEntries = true)
    public PurchaseReturnResponse create(CreatePurchaseReturnRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new NotFoundException("Nhà cung cấp không tồn tại"));
        if (!supplier.isActive()) {
            throw new BadRequestException("Nhà cung cấp không hoạt động");
        }
        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new NotFoundException("Kho không tồn tại"));
        if (!location.isActive()) {
            throw new BadRequestException("Kho không hoạt động");
        }

        PurchaseOrder purchaseOrder = null;
        if (request.getPurchaseOrderId() != null) {
            purchaseOrder = purchaseOrderRepository.findById(request.getPurchaseOrderId())
                    .orElseThrow(() -> new NotFoundException("Phiếu nhập không tồn tại"));
        }

        PurchaseReturnOrder returnOrder = PurchaseReturnOrder.builder()
                .supplier(supplier)
                .location(location)
                .purchaseOrder(purchaseOrder)
                .status(PurchaseReturnStatus.COMPLETED)
                .returnDate(LocalDateTime.now())
                .totalAmount(BigDecimal.ZERO)
                .createdBy(SecurityUtils.getCurrentUserId().orElse(null))
                .note(blankToNull(request.getNote()))
                .build();

        BigDecimal total = BigDecimal.ZERO;
        Long userId = SecurityUtils.getCurrentUserId().orElse(null);

        for (PurchaseReturnLineRequest line : request.getItems()) {
            Item item = itemService.findItem(line.getItemId());
            ItemLot lot = findLot(line.getLotId());
            BigDecimal subtotal = line.getUnitPrice().multiply(line.getQuantity());

            returnOrder.getItems().add(PurchaseReturnOrderItem.builder()
                    .purchaseReturn(returnOrder)
                    .item(item)
                    .lot(lot)
                    .quantity(line.getQuantity())
                    .unitPrice(line.getUnitPrice())
                    .subtotal(subtotal)
                    .build());
            total = total.add(subtotal);
        }

        returnOrder.setTotalAmount(total);
        PurchaseReturnOrder saved = purchaseReturnOrderRepository.save(returnOrder);

        for (PurchaseReturnOrderItem line : saved.getItems()) {
            if (line.getLot() != null) {
                inventoryLedgerService.applyMovement(
                        line.getItem(), location, line.getLot(),
                        line.getQuantity().negate(),
                        InventoryActionType.PURCHASE_RETURN,
                        ReferenceType.PURCHASE_RETURN,
                        saved.getId(), userId, "Trả hàng NCC");
            } else {
                List<InventoryLedgerService.LotAllocation> allocations =
                        inventoryLedgerService.allocateFefo(line.getItem(), location, line.getQuantity());
                for (InventoryLedgerService.LotAllocation allocation : allocations) {
                    inventoryLedgerService.applyMovement(
                            line.getItem(), location, allocation.lot(),
                            allocation.quantity().negate(),
                            InventoryActionType.PURCHASE_RETURN,
                            ReferenceType.PURCHASE_RETURN,
                            saved.getId(), userId, "Trả hàng NCC");
                }
            }
        }

        auditLogService.log(AuditAction.PURCHASE_RETURN_CREATE, "PURCHASE_RETURN",
                saved.getId().toString(), "Trả hàng NCC #" + saved.getId(),
                null, AuditData.of("totalAmount", saved.getTotalAmount()));
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseReturnResponse getById(Long id) {
        return toResponse(findWithDetails(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseReturnResponse> listAll() {
        return purchaseReturnOrderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse).toList();
    }

    private PurchaseReturnOrder findWithDetails(Long id) {
        return purchaseReturnOrderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu trả hàng: " + id));
    }

    private ItemLot findLot(Long id) {
        if (id == null) return null;
        return itemLotRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy lô hàng: " + id));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private PurchaseReturnResponse toResponse(PurchaseReturnOrder order) {
        List<PurchaseReturnItemResponse> items = order.getItems().stream()
                .map(i -> PurchaseReturnItemResponse.builder()
                        .id(i.getId())
                        .itemId(i.getItem().getId())
                        .itemName(i.getItem().getItemName())
                        .lotId(i.getLot() != null ? i.getLot().getId() : null)
                        .lotNumber(i.getLot() != null ? i.getLot().getLotNumber() : null)
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .subtotal(i.getSubtotal())
                        .build())
                .toList();

        return PurchaseReturnResponse.builder()
                .id(order.getId())
                .supplierId(order.getSupplier().getId())
                .supplierName(order.getSupplier().getSupplierName())
                .locationId(order.getLocation().getId())
                .locationName(order.getLocation().getLocationName())
                .purchaseOrderId(order.getPurchaseOrder() != null ? order.getPurchaseOrder().getId() : null)
                .status(order.getStatus())
                .returnDate(order.getReturnDate())
                .totalAmount(order.getTotalAmount())
                .note(order.getNote())
                .items(items)
                .build();
    }
}
