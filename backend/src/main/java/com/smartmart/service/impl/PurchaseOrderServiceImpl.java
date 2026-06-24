package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreatePurchaseOrderRequest;
import com.smartmart.dto.request.PurchaseLineRequest;
import com.smartmart.dto.response.PurchaseOrderItemResponse;
import com.smartmart.dto.response.PurchaseOrderResponse;
import com.smartmart.entity.*;
import com.smartmart.enums.InventoryActionType;
import com.smartmart.enums.PurchaseStatus;
import com.smartmart.enums.ReferenceType;
import com.smartmart.event.PurchaseOrderStatusEvent;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.service.*;
import org.springframework.context.ApplicationEventPublisher;
import com.smartmart.repository.*;
import com.smartmart.security.SecurityUtils;
import com.smartmart.util.AuditData;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final LocationRepository locationRepository;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final ItemService itemService;
    private final InventoryLedgerService inventoryLedgerService;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final AuditLogService auditLogService;
    private final ItemLotRepository itemLotRepository;
    private final ItemRepository itemRepository;
    private final SupplierDebtService supplierDebtService;
    private final SupplierItemService supplierItemService;

    public PurchaseOrderServiceImpl(
            PurchaseOrderRepository purchaseOrderRepository,
            SupplierRepository supplierRepository,
            LocationRepository locationRepository,
            CurrentInventoryRepository currentInventoryRepository,
            ItemService itemService,
            InventoryLedgerService inventoryLedgerService,
            ApplicationEventPublisher applicationEventPublisher,
            AuditLogService auditLogService,
            ItemLotRepository itemLotRepository,
            ItemRepository itemRepository,
            SupplierDebtService supplierDebtService,
            SupplierItemService supplierItemService) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.supplierRepository = supplierRepository;
        this.locationRepository = locationRepository;
        this.currentInventoryRepository = currentInventoryRepository;
        this.itemService = itemService;
        this.inventoryLedgerService = inventoryLedgerService;
        this.applicationEventPublisher = applicationEventPublisher;
        this.auditLogService = auditLogService;
        this.itemLotRepository = itemLotRepository;
        this.itemRepository = itemRepository;
        this.supplierDebtService = supplierDebtService;
        this.supplierItemService = supplierItemService;
    }

    @Override
    @CacheEvict(value = "purchaseOrders", allEntries = true)
    public PurchaseOrderResponse create(CreatePurchaseOrderRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new NotFoundException("Nhà cung cấp không tồn tại hoặc đã ngừng hoạt động."));
        if (!supplier.isActive()) {
            throw new BadRequestException("Nhà cung cấp không tồn tại hoặc đã ngừng hoạt động.");
        }

        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new NotFoundException("Địa điểm nhận hàng không hợp lệ."));
        if (!location.isActive()) {
            throw new BadRequestException("Kho nhận hàng đã ngừng hoạt động.");
        }

        PurchaseOrder po = PurchaseOrder.builder()
                .supplier(supplier)
                .location(location)
                .createdBy(SecurityUtils.getCurrentUserId().orElse(null))
                .status(PurchaseStatus.PENDING)
                .purchaseDate(LocalDateTime.now())
                .totalAmount(BigDecimal.ZERO)
                .paymentDeferred(Boolean.TRUE.equals(request.getPaymentDeferred()))
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

            supplierItemService.validateItemSuppliedBySupplier(supplier.getId(), item.getItemCode());

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

        auditLogService.log(
                AuditAction.PURCHASE_CREATE,
                "PURCHASE_ORDER",
                savedPo.getId().toString(),
                "Tạo phiếu nhập #" + savedPo.getId(),
                null,
                AuditData.of(
                        "supplierId", savedPo.getSupplier().getId(),
                        "locationId", savedPo.getLocation().getId(),
                        "totalAmount", savedPo.getTotalAmount(),
                        "status", savedPo.getStatus()));
        applicationEventPublisher.publishEvent(new PurchaseOrderStatusEvent(this, savedPo.getId(), "PURCHASE_CREATED"));

        return toResponse(savedPo);
    }

    @Override
    @CacheEvict(value = { "items", "itemsPage", "purchaseOrders" }, allEntries = true)
    public PurchaseOrderResponse receive(Long purchaseId) {
        PurchaseOrder po = purchaseOrderRepository.findWithDetailsById(purchaseId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu nhập"));

        if (po.getStatus() != PurchaseStatus.PENDING) {
            throw new BadRequestException("Không thể nhận hàng! Phiếu nhập đã hoàn thành hoặc hủy.");
        }

        Long userId = SecurityUtils.getCurrentUserId().orElse(null);

        List<PurchaseOrderItem> sortedItems = new ArrayList<>(po.getItems());
        sortedItems.sort(Comparator.comparing(poi -> poi.getItem().getId()));

        for (PurchaseOrderItem poi : sortedItems) {
            Item item = itemRepository.findByIdWithPessimisticLock(poi.getItem().getId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm"));

            Uom orderedUom = item.getPurchaseUom() != null ? item.getPurchaseUom() : item.getBaseUom();
            BigDecimal conversionRatio = orderedUom.getConversionRatio();
            BigDecimal baseRatio = item.getBaseUom() != null ? item.getBaseUom().getConversionRatio() : BigDecimal.ONE;
            BigDecimal ratioToCalculateBaseQty = conversionRatio.divide(baseRatio, 6, RoundingMode.HALF_UP);

            if (ratioToCalculateBaseQty.compareTo(BigDecimal.ZERO) == 0) {
                throw new BadRequestException("Tỉ lệ quy đổi không hợp lệ (bằng 0). Không thể thực hiện nhận hàng.");
            }

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

            BigDecimal newCostPrice = calculateMovingAverageCost(item, poi, ratioToCalculateBaseQty, baseQty, oldQty);

            item.setCostPrice(newCostPrice);

            poi.setReceivedQty(poi.getOrderedQty());
        }

        String beforeData = AuditData.of("status", po.getStatus());
        po.setStatus(PurchaseStatus.COMPLETED);
        po.setCompletedAt(LocalDateTime.now());

        purchaseOrderRepository.save(po);
        auditLogService.log(
                AuditAction.PURCHASE_RECEIVE,
                "PURCHASE_ORDER",
                po.getId().toString(),
                "Nhận hàng phiếu #" + po.getId(),
                beforeData,
                AuditData.of(
                        "status", po.getStatus(),
                        "completedAt", po.getCompletedAt()));
        if (po.isPaymentDeferred()) {
            supplierDebtService.createFromPurchaseOrder(po.getId(), LocalDate.now().plusDays(30));
        }
        applicationEventPublisher.publishEvent(new PurchaseOrderStatusEvent(this, po.getId(), "PURCHASE_RECEIVED"));

        return toResponse(po);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseOrderResponse> list(Long supplierId, Long locationId, String search, PurchaseStatus status,
            LocalDate fromDate, LocalDate toDate, Pageable pageable) {

        Specification<PurchaseOrder> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (supplierId != null) {
                predicates.add(cb.equal(root.get("supplier").get("id"), supplierId));
            }
            if (locationId != null) {
                predicates.add(cb.equal(root.get("location").get("id"), locationId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("id").as(String.class), "%" + search + "%"),
                        cb.like(cb.lower(root.get("supplier").get("supplierName")), pattern)));
            }

            LocalDateTime safeFrom = fromDate != null ? fromDate.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
            LocalDateTime safeTo = toDate != null ? toDate.plusDays(1).atStartOfDay()
                    : LocalDateTime.of(2100, 1, 1, 0, 0);
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), safeFrom));
            predicates.add(cb.lessThan(root.get("createdAt"), safeTo));

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<PurchaseOrder> poPage = purchaseOrderRepository.findAll(spec, pageable);

        if (poPage.isEmpty()) {
            return Page.empty(pageable);
        }

        List<Long> ids = poPage.getContent().stream().map(PurchaseOrder::getId).toList();
        List<PurchaseOrder> detailed = purchaseOrderRepository.findByIdInOrderByCreatedAtDesc(ids);

        Map<Long, PurchaseOrder> map = detailed.stream()
                .collect(Collectors.toMap(PurchaseOrder::getId, po -> po));
        List<PurchaseOrderResponse> responses = ids.stream()
                .map(map::get)
                .filter(Objects::nonNull)
                .map(this::toResponse)
                .toList();

        return new PageImpl<>(responses, pageable, poPage.getTotalElements());
    }

    @Override
    @Cacheable(value = "purchaseOrders", key = "#id")
    @Transactional(readOnly = true)
    public PurchaseOrderResponse getById(Long id) {
        return purchaseOrderRepository.findWithDetailsById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu nhập"));
    }

    @Override
    @CacheEvict(value = "purchaseOrders", allEntries = true)
    public PurchaseOrderResponse cancel(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu nhập"));

        String beforeData = AuditData.of("status", po.getStatus());
        if (po.getStatus() != PurchaseStatus.PENDING) {
            throw new BadRequestException("Phiếu nhập không ở trạng thái PENDING.");
        }

        long hoursSinceCreation = ChronoUnit.HOURS.between(po.getPurchaseDate(), LocalDateTime.now());
        if (hoursSinceCreation > 24) {
            throw new BadRequestException("Đã quá thời hạn 24 tiếng để hủy đơn tự động. Vui lòng liên hệ hỗ trợ.");
        }

        for (PurchaseOrderItem poi : po.getItems()) {
            if (poi.getLot() != null) {
                Long lotIdToTrash = poi.getLot().getId();
                poi.setLot(null);
                itemLotRepository.deleteById(lotIdToTrash);
            }
        }

        po.setStatus(PurchaseStatus.CANCELLED);
        purchaseOrderRepository.save(po);

        auditLogService.log(
                AuditAction.PURCHASE_CANCEL,
                "PURCHASE_ORDER",
                po.getId().toString(),
                "Hủy phiếu nhập #" + po.getId(),
                beforeData,
                AuditData.of("status", po.getStatus()));
        applicationEventPublisher.publishEvent(new PurchaseOrderStatusEvent(this, po.getId(), "PURCHASE_CANCELLED"));

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

    @Override
    @Cacheable(value = "purchaseOrders", key = "'all'")
    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> listAll() {
        return purchaseOrderRepository.findAllByOrderByPurchaseDateDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Cacheable(value = "purchaseOrders", key = "'status-' + #status.name()")
    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> listByStatus(PurchaseStatus status) {
        return purchaseOrderRepository.findByStatusOrderByPurchaseDateDesc(status, Pageable.unpaged()).stream()
                .map(this::toResponse)
                .toList();
    }

    private BigDecimal calculateMovingAverageCost(Item item, PurchaseOrderItem poi, BigDecimal ratioToCalculateBaseQty,
            BigDecimal baseQty, BigDecimal oldQty) {
        BigDecimal newBaseCost = poi.getUnitPrice().divide(ratioToCalculateBaseQty, 4, RoundingMode.HALF_UP);
        BigDecimal totalOldCost = oldQty.multiply(item.getCostPrice() != null ? item.getCostPrice() : BigDecimal.ZERO);
        BigDecimal totalNewCost = baseQty.multiply(newBaseCost);

        BigDecimal totalQty = oldQty.add(baseQty);
        if (totalQty.compareTo(BigDecimal.ZERO) == 0) {
            return newBaseCost;
        }
        return totalOldCost.add(totalNewCost).divide(totalQty, 4, RoundingMode.HALF_UP);
    }
}
