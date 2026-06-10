package com.smartmart.service.impl;

import com.smartmart.dto.request.CreatePurchaseOrderRequest;
import com.smartmart.dto.request.PurchaseLineRequest;
import com.smartmart.dto.response.PurchaseOrderItemResponse;
import com.smartmart.dto.response.PurchaseOrderResponse;
import com.smartmart.entity.*;
import com.smartmart.enums.InventoryActionType;
import com.smartmart.enums.PurchaseStatus;
import com.smartmart.enums.ReferenceType;
import com.smartmart.event.PurchaseEventPublisher;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.*;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.InventoryLedgerService;
import com.smartmart.service.ItemService;
import com.smartmart.service.PurchaseOrderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

@Service
@Transactional
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final LocationRepository locationRepository;
    private final UomRepository uomRepository;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final ItemService itemService;
    private final InventoryLedgerService inventoryLedgerService;
    private final PurchaseEventPublisher purchaseEventPublisher;
    private final AuditLogService auditLogService;
    private final ItemLotRepository itemLotRepository;
    private final ItemRepository itemRepository;

    public PurchaseOrderServiceImpl(
            PurchaseOrderRepository purchaseOrderRepository,
            SupplierRepository supplierRepository,
            LocationRepository locationRepository,
            UomRepository uomRepository,
            CurrentInventoryRepository currentInventoryRepository,
            ItemService itemService,
            InventoryLedgerService inventoryLedgerService,
            PurchaseEventPublisher purchaseEventPublisher,
            AuditLogService auditLogService,
            ItemLotRepository itemLotRepository,
            ItemRepository itemRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.supplierRepository = supplierRepository;
        this.locationRepository = locationRepository;
        this.uomRepository = uomRepository;
        this.currentInventoryRepository = currentInventoryRepository;
        this.itemService = itemService;
        this.inventoryLedgerService = inventoryLedgerService;
        this.purchaseEventPublisher = purchaseEventPublisher;
        this.auditLogService = auditLogService;
        this.itemLotRepository = itemLotRepository;
        this.itemRepository = itemRepository;
    }

    @Override
    public PurchaseOrderResponse create(CreatePurchaseOrderRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new NotFoundException("Nhà cung cấp không tồn tại hoặc đã ngừng hoạt động."));
        if (!supplier.isActive()) {
            throw new BadRequestException("Nhà cung cấp không tồn tại hoặc đã ngừng hoạt động.");
        }

        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new NotFoundException("Địa điểm nhận hàng không hợp lệ."));
        if (location.getParent() == null) {
            throw new BadRequestException("Địa điểm nhận hàng không hợp lệ (Phải là kho con).");
        }

        PurchaseOrder po = PurchaseOrder.builder()
                .supplier(supplier)
                .location(location)
                .createdBy(SecurityUtils.getCurrentUserId().orElse(null))
                .status(PurchaseStatus.PENDING)
                .purchaseDate(LocalDateTime.now())
                .totalAmount(BigDecimal.ZERO)
                .build();

        PurchaseOrder savedPo = purchaseOrderRepository.save(po);

        BigDecimal total = BigDecimal.ZERO;
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int lineIndex = 1;

        for (PurchaseLineRequest line : request.getItems()) {
            Item item = itemService.findItem(line.getItemId());
            if (!item.isActive()) {
                throw new BadRequestException("Sản phẩm không tồn tại hoặc ngừng kinh doanh.");
            }
            if (line.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Số lượng đặt hàng phải lớn hơn 0.");
            }
            if (line.getUnitPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Đơn giá nhập phải lớn hơn 0.");
            }

            if (item.isHasExpiry()) {
                if (line.getExpiryDate() == null || !line.getExpiryDate().isAfter(LocalDate.now())) {
                    throw new BadRequestException("Sản phẩm bắt buộc phải nhập HSD và phải lớn hơn ngày hiện tại.");
                }
            }

            String lotNum = String.format("LOT-%d-%d-%s-%d-%d",
                    location.getId(), item.getId(), dateStr, savedPo.getId(), lineIndex);

            ItemLot lot = inventoryLedgerService.getOrCreateLot(item, lotNum, line.getExpiryDate());

            BigDecimal subtotal = line.getUnitPrice().multiply(line.getQuantity());
            PurchaseOrderItem poi = PurchaseOrderItem.builder()
                    .purchaseOrder(savedPo)
                    .item(item)
                    .orderedQty(line.getQuantity())
                    .receivedQty(BigDecimal.ZERO)
                    .unitPrice(line.getUnitPrice())
                    .subtotal(subtotal)
                    .lot(lot)
                    .build();
            savedPo.getItems().add(poi);
            total = total.add(subtotal);
            lineIndex++;
        }

        savedPo.setTotalAmount(total);
        purchaseOrderRepository.save(savedPo);

        auditLogService.log("PURCHASE_CREATE", "Tạo phiếu nhập #" + savedPo.getId());
        purchaseEventPublisher.publishPurchaseCreated(savedPo.getId());

        return toResponse(savedPo);
    }

    @Override
    @org.springframework.cache.annotation.CacheEvict(value = { "items", "itemsPage" }, allEntries = true)
    public PurchaseOrderResponse receive(Long purchaseId) {
        PurchaseOrder po = purchaseOrderRepository.findByIdWithDetails(purchaseId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu nhập"));

        if (po.getStatus() != PurchaseStatus.PENDING) {
            throw new BadRequestException("Không thể nhận hàng! Phiếu nhập đã hoàn thành hoặc hủy.");
        }

        UUID userId = SecurityUtils.getCurrentUserId().orElse(null);

        // Sort items by ID to prevent Deadlocks when acquiring Pessimistic Locks
        List<PurchaseOrderItem> sortedItems = new java.util.ArrayList<>(po.getItems());
        sortedItems.sort(java.util.Comparator.comparing(poi -> poi.getItem().getId()));

        for (PurchaseOrderItem poi : sortedItems) {
            // Lock the Item row in the DB to MAC safely
            Item item = itemRepository.findByIdWithPessimisticLock(poi.getItem().getId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm"));

            Uom orderedUom = item.getPurchaseUom() != null ? item.getPurchaseUom() : item.getBaseUom();
            BigDecimal conversionRatio = orderedUom.getConversionRatio();
            BigDecimal baseRatio = item.getBaseUom() != null ? item.getBaseUom().getConversionRatio() : BigDecimal.ONE;
            BigDecimal ratioToCalculateBaseQty = conversionRatio.divide(baseRatio, 6, RoundingMode.HALF_UP);

            BigDecimal baseQty = poi.getOrderedQty().multiply(ratioToCalculateBaseQty);

            BigDecimal oldQty = currentInventoryRepository.sumQuantityByItemId(item.getId());

            inventoryLedgerService.applyMovement(
                    item, po.getLocation(), poi.getLot(),
                    baseQty,
                    InventoryActionType.PURCHASE_RECEIVE,
                    ReferenceType.PURCHASE_ORDER,
                    po.getId(),
                    userId,
                    "Nhập kho");

            BigDecimal newBaseCost = poi.getUnitPrice().divide(ratioToCalculateBaseQty, 4, RoundingMode.HALF_UP);
            BigDecimal totalOldCost = oldQty
                    .multiply(item.getCostPrice() != null ? item.getCostPrice() : BigDecimal.ZERO);
            BigDecimal totalNewCost = baseQty.multiply(newBaseCost);
            BigDecimal newCostPrice = totalOldCost.add(totalNewCost).divide(oldQty.add(baseQty), 4,
                    RoundingMode.HALF_UP);

            item.setCostPrice(newCostPrice);

            poi.setReceivedQty(poi.getOrderedQty());
        }

        po.setStatus(PurchaseStatus.COMPLETED);
        po.setCompletedAt(LocalDateTime.now());

        purchaseOrderRepository.save(po);
        auditLogService.log("PURCHASE_RECEIVE", "Nhận hàng phiếu #" + po.getId());
        purchaseEventPublisher.publishPurchaseReceived(po.getId());

        return toResponse(po);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseOrderResponse> list(Long supplierId, Long locationId, String search, PurchaseStatus status, LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        LocalDateTime safeFrom = fromDate != null ? fromDate.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime safeTo = toDate != null ? toDate.plusDays(1).atStartOfDay() : LocalDateTime.of(2100, 1, 1, 0, 0);

        Page<Long> idPage = purchaseOrderRepository.findFilteredIdsPaged(supplierId, locationId, search, status, safeFrom, safeTo, pageable);

        if (idPage.isEmpty()) {
            return Page.empty(pageable);
        }

        List<PurchaseOrder> pos = purchaseOrderRepository.findByIdsWithDetails(idPage.getContent());

        // order based on original pageIds list
        java.util.Map<Long, PurchaseOrder> map = pos.stream().collect(
                java.util.stream.Collectors.toMap(PurchaseOrder::getId, java.util.function.Function.identity()));
        List<PurchaseOrderResponse> responses = idPage.getContent().stream()
                .map(map::get)
                .map(this::toResponse)
                .toList();

        return new PageImpl<>(responses, pageable, idPage.getTotalElements());
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

        if (po.getStatus() != PurchaseStatus.PENDING) {
            throw new BadRequestException("Phiếu nhập không ở trạng thái PENDING.");
        }

        long hoursSinceCreation = ChronoUnit.HOURS.between(po.getPurchaseDate(), LocalDateTime.now());
        if (hoursSinceCreation > 24) {
            throw new BadRequestException("Đã quá thời hạn 24 tiếng để hủy đơn tự động. Vui lòng liên hệ hỗ trợ.");
        }

        // Clean up ItemLot to prevent garbage data in DB
        for (PurchaseOrderItem poi : po.getItems()) {
            if (poi.getLot() != null) {
                Long lotIdToTrash = poi.getLot().getId();
                poi.setLot(null);
                itemLotRepository.deleteById(lotIdToTrash);
            }
        }

        po.setStatus(PurchaseStatus.CANCELLED);
        purchaseOrderRepository.save(po);

        auditLogService.log("PURCHASE_CANCEL", "Hủy phiếu nhập #" + po.getId());
        purchaseEventPublisher.publishPurchaseCancelled(po.getId());

        return toResponse(po);
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder po) {
        List<PurchaseOrderItemResponse> itemResponses = po.getItems().stream()
                .map(i -> PurchaseOrderItemResponse.builder()
                        .id(i.getId())
                        .itemId(i.getItem().getId())
                        .itemName(i.getItem().getItemName())
                        .uomName(i.getItem().getPurchaseUom() != null ? i.getItem().getPurchaseUom().getUomName()
                                : (i.getItem().getBaseUom() != null ? i.getItem().getBaseUom().getUomName() : null))
                        .orderedQty(i.getOrderedQty())
                        .receivedQty(i.getReceivedQty())
                        .unitPrice(i.getUnitPrice())
                        .subtotal(i.getSubtotal())
                        .lotCode(i.getLot() != null ? i.getLot().getLotNumber() : null)
                        .expiryDate(i.getLot() != null ? i.getLot().getExpiryDate() : null)
                        .build())
                .toList();

        return PurchaseOrderResponse.builder()
                .id(po.getId())
                .supplierId(po.getSupplier() != null ? po.getSupplier().getId() : null)
                .supplierName(po.getSupplier() != null ? po.getSupplier().getSupplierName() : null)
                .locationId(po.getLocation() != null ? po.getLocation().getId() : null)
                .locationName(po.getLocation() != null ? po.getLocation().getLocationName() : null)
                .status(po.getStatus())
                .purchaseDate(po.getPurchaseDate())
                .completedAt(po.getCompletedAt())
                .totalAmount(po.getTotalAmount())
                .items(itemResponses)
                .build();
    }
}
