package com.smartmart.service.impl;

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
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.InventoryLedgerService;
import com.smartmart.service.ItemService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ScrapOrderServiceImpl implements com.smartmart.service.ScrapOrderService {

    private final ScrapOrderRepository scrapOrderRepository;
    private final LocationRepository locationRepository;
    private final ItemLotRepository itemLotRepository;
    private final ItemService itemService;
    private final InventoryLedgerService inventoryLedgerService;

    public ScrapOrderServiceImpl(
            ScrapOrderRepository scrapOrderRepository,
            LocationRepository locationRepository,
            ItemLotRepository itemLotRepository,
            ItemService itemService,
            InventoryLedgerService inventoryLedgerService
    ) {
        this.scrapOrderRepository = scrapOrderRepository;
        this.locationRepository = locationRepository;
        this.itemLotRepository = itemLotRepository;
        this.itemService = itemService;
        this.inventoryLedgerService = inventoryLedgerService;
    }

    @Override
    public ScrapOrder create(CreateScrapOrderRequest request) {
        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy kho"));
        ScrapOrder scrap = ScrapOrder.builder()
                .location(location)
                .createdBy(SecurityUtils.getCurrentUserId().orElse(null))
                .scrapDate(LocalDateTime.now())
                .status(ScrapStatus.DRAFT)
                .build();
        for (ScrapLineRequest line : request.getItems()) {
            Item item = itemService.findItem(line.getItemId());
            ItemLot lot = line.getLotId() != null
                    ? itemLotRepository.findById(line.getLotId()).orElseThrow(() -> new NotFoundException("Không tìm thấy lô"))
                    : null;
            scrap.getItems().add(ScrapOrderItem.builder()
                    .scrapOrder(scrap)
                    .item(item)
                    .lot(lot)
                    .quantity(line.getQuantity())
                    .reason(line.getReason())
                    .build());
        }
        return scrapOrderRepository.save(scrap);
    }

    @Override
    public ScrapOrder complete(ScrapOrder scrap) {
        if (scrap.getStatus() == ScrapStatus.COMPLETED) {
            throw new BadRequestException("Phiếu hủy đã hoàn tất");
        }
        UUID userId = SecurityUtils.getCurrentUserId().orElse(null);
        for (ScrapOrderItem line : scrap.getItems()) {
            inventoryLedgerService.applyMovement(
                    line.getItem(),
                    scrap.getLocation(),
                    line.getLot(),
                    line.getQuantity().negate(),
                    InventoryActionType.SCRAP,
                    ReferenceType.SCRAP_ORDER,
                    scrap.getId(),
                    userId,
                    line.getReason()
            );
        }
        scrap.setStatus(ScrapStatus.COMPLETED);
        return scrapOrderRepository.save(scrap);
    }

    @Override
    public ScrapOrder createDraft(Long locationId, List<ScrapOrderItem> items) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy kho"));
        ScrapOrder scrap = ScrapOrder.builder()
                .location(location)
                .createdBy(SecurityUtils.getCurrentUserId().orElse(null))
                .scrapDate(LocalDateTime.now())
                .status(ScrapStatus.DRAFT)
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
        return scrapOrderRepository.findAll();
    }
}
