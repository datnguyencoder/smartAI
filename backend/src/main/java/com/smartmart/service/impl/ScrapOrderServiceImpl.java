package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreateScrapOrderRequest;
import com.smartmart.dto.request.ScrapLineRequest;
import com.smartmart.entity.*;
import com.smartmart.enums.InventoryActionType;
import com.smartmart.enums.ReferenceType;
import com.smartmart.enums.ScrapStatus;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.ItemLotRepository;
import com.smartmart.repository.LocationRepository;
import com.smartmart.repository.ScrapOrderRepository;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.InventoryLedgerService;
import com.smartmart.service.ItemService;
import com.smartmart.util.AuditData;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ScrapOrderServiceImpl implements com.smartmart.service.ScrapOrderService {

    private final ScrapOrderRepository scrapOrderRepository;
    private final LocationRepository locationRepository;
    private final ItemLotRepository itemLotRepository;
    private final ItemService itemService;
    private final InventoryLedgerService inventoryLedgerService;
    private final AuditLogService auditLogService;

    private final CurrentInventoryRepository currentInventoryRepository;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    public ScrapOrderServiceImpl(
            ScrapOrderRepository scrapOrderRepository,
            LocationRepository locationRepository,
            ItemLotRepository itemLotRepository,
            ItemService itemService,
            InventoryLedgerService inventoryLedgerService,
            CurrentInventoryRepository currentInventoryRepository,
            org.springframework.context.ApplicationEventPublisher eventPublisher,
            AuditLogService auditLogService
    ) {
        this.scrapOrderRepository = scrapOrderRepository;
        this.locationRepository = locationRepository;
        this.itemLotRepository = itemLotRepository;
        this.itemService = itemService;
        this.inventoryLedgerService = inventoryLedgerService;
        this.currentInventoryRepository = currentInventoryRepository;
        this.eventPublisher = eventPublisher;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public ScrapOrder create(CreateScrapOrderRequest request) {
        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy kho"));
                
        // Fast-fail check
        for (ScrapLineRequest line : request.getItems()) {
            BigDecimal available = getExactAvailableQuantity(line.getItemId(), location.getId(), line.getLotId());
            if (available.compareTo(line.getQuantity()) < 0) {
                Item item = itemService.findItem(line.getItemId());
                throw new com.smartmart.exception.InsufficientStockException("Không đủ tồn kho khả dụng cho sản phẩm: " + item.getItemName());
            }
        }

        ScrapOrder scrap = ScrapOrder.builder()
                .location(location)
                .createdBy(SecurityUtils.getCurrentUserId().orElse(null))
                .scrapDate(LocalDateTime.now())
                .status(ScrapStatus.PENDING)
                .build();
        for (ScrapLineRequest line : request.getItems()) {
            Item item = itemService.findItem(line.getItemId());
            ItemLot lot = line.getLotId() != null
                    ? itemLotRepository.findById(line.getLotId()).orElseThrow(() -> new NotFoundException("Không tìm thấy lô"))
                    : null;
            if (lot != null && !lot.getItem().getId().equals(item.getId())) {
                throw new BadRequestException("Lô không thuộc sản phẩm xuất hủy");
            }
            scrap.getItems().add(ScrapOrderItem.builder()
                    .scrapOrder(scrap)
                    .item(item)
                    .lot(lot)
                    .quantity(line.getQuantity())
                    .reason(line.getReason())
                    .build());
        }
        ScrapOrder saved = scrapOrderRepository.save(scrap);
        
        Long userId = SecurityUtils.getCurrentUserId().orElse(null);
        for (ScrapOrderItem line : saved.getItems()) {
            inventoryLedgerService.logActionOnly(
                    line.getItem(),
                    saved.getLocation(),
                    line.getLot(),
                    InventoryActionType.SCRAP_PENDING,
                    ReferenceType.SCRAP_ORDER,
                    saved.getId(),
                    userId,
                    line.getReason()
            );
        }
        auditLogService.log(
                AuditAction.SCRAP_CREATE,
                "SCRAP_ORDER",
                saved.getId().toString(),
                "Tạo phiếu hủy #" + saved.getId(),
                null,
                AuditData.of(
                        "locationId", saved.getLocation().getId(),
                        "status", saved.getStatus(),
                        "itemCount", saved.getItems().size()
                )
        );
        return saved;
    }

    @Override
    @Transactional
    public ScrapOrder approve(Long id) {
        ScrapOrder scrap = findById(id);
        if (scrap.getStatus() != ScrapStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể duyệt phiếu đang chờ (PENDING)");
        }
        String beforeData = AuditData.of("status", scrap.getStatus());
        Long userId = SecurityUtils.getCurrentUserId().orElse(null);
        for (ScrapOrderItem line : scrap.getItems()) {
            inventoryLedgerService.applyMovementAndUpdateLog(
                    line.getItem(),
                    scrap.getLocation(),
                    line.getLot(),
                    line.getQuantity().negate(),
                    InventoryActionType.SCRAP_COMPLETED,
                    ReferenceType.SCRAP_ORDER,
                    scrap.getId(),
                    userId,
                    line.getReason()
            );
        }

            scrap.setStatus(ScrapStatus.COMPLETED);
            ScrapOrder updated = scrapOrderRepository.save(scrap);

            auditLogService.log(
                    AuditAction.SCRAP_APPROVE,
                    "SCRAP_ORDER",
                    updated.getId().toString(),
                    "Duyệt phiếu hủy #" + updated.getId(),
                    beforeData,
                    AuditData.of("status", updated.getStatus()
                    )
            );

            eventPublisher.publishEvent(
                    new com.smartmart.event.ScrapOrderCompletedEvent(
                            this, updated.getId()
                    )
            );
        return updated;
    }

    
    @Override
    @Transactional
    public ScrapOrder cancel(Long id, String reason) {
        ScrapOrder scrap = findById(id);
        if (scrap.getStatus() != ScrapStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể hủy phiếu đang chờ (PENDING)");
        }
        String beforeData = AuditData.of("status", scrap.getStatus(),
                "note", scrap.getNote());

        String oldNote = scrap.getNote() != null ? scrap.getNote() : "";
        scrap.setNote(oldNote + " | TỪ CHỐI: " + reason);
        scrap.setStatus(ScrapStatus.CANCELLED);
        
        inventoryLedgerService.deleteLogsByReference(ReferenceType.SCRAP_ORDER, scrap.getId());

        ScrapOrder saved = scrapOrderRepository.save(scrap);
        auditLogService.log(
                AuditAction.SCRAP_CANCEL,
                "SCRAP_ORDER",
                saved.getId().toString(),
                "Từ chối phiếu hủy #" + saved.getId(),
                beforeData,
                AuditData.of(
                        "status", saved.getStatus(),
                        "note", saved.getNote(),
                        "reason", reason
                )
        );
        return saved;
    }

    @Override
    @Transactional
    public ScrapOrder createDraft(Long locationId, List<ScrapOrderItem> items) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy kho"));
        ScrapOrder scrap = ScrapOrder.builder()
                .location(location)
                .createdBy(SecurityUtils.getCurrentUserId().orElse(null))
                .scrapDate(LocalDateTime.now())
                .status(ScrapStatus.PENDING)
                .build();
        scrap.getItems().addAll(items);
        return scrapOrderRepository.save(scrap);
    }

    @Transactional(readOnly = true)
    @Override
    public ScrapOrder findById(Long id) {
        return scrapOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu hủy"));
    }

    @Transactional(readOnly = true)
    @Override
    public List<ScrapOrder> listAll() {
        return scrapOrderRepository.findAllByOrderByIdDesc();
    }

    private BigDecimal getExactAvailableQuantity(Long itemId, Long locationId, Long lotId) {
        return currentInventoryRepository.findByItemLocationLot(itemId, locationId, lotId)
                .map(ci -> ci.getQuantity().subtract(ci.getReservedQuantity()))
                .orElse(BigDecimal.ZERO);
    }
}
