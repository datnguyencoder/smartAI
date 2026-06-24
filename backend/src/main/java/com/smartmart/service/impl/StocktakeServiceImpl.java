package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreateStocktakeRequest;
import com.smartmart.dto.request.StocktakeLineRequest;
import com.smartmart.dto.request.ConfirmStocktakeRequest;
import com.smartmart.dto.response.StocktakeResponse;
import com.smartmart.entity.*;
import com.smartmart.enums.InventoryActionType;
import com.smartmart.enums.ReferenceType;
import com.smartmart.enums.StocktakeStatus;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.repository.ItemLotRepository;
import com.smartmart.repository.LocationRepository;
import com.smartmart.repository.StocktakeRepository;
import com.smartmart.repository.UserRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.InventoryLedgerService;
import com.smartmart.service.ItemService;
import com.smartmart.service.StocktakeService;
import com.smartmart.util.AuditData;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional
public class StocktakeServiceImpl implements StocktakeService {

    private final StocktakeRepository stocktakeRepository;
    private final LocationRepository locationRepository;
    private final ItemLotRepository itemLotRepository;
    private final ItemService itemService;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final InventoryLedgerService inventoryLedgerService;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;

    public StocktakeServiceImpl(
            StocktakeRepository stocktakeRepository,
            LocationRepository locationRepository,
            ItemLotRepository itemLotRepository,
            ItemService itemService,
            CurrentInventoryRepository currentInventoryRepository,
            InventoryLedgerService inventoryLedgerService,
            AuditLogService auditLogService,
            UserRepository userRepository
    ) {
        this.stocktakeRepository = stocktakeRepository;
        this.locationRepository = locationRepository;
        this.itemLotRepository = itemLotRepository;
        this.itemService = itemService;
        this.currentInventoryRepository = currentInventoryRepository;
        this.inventoryLedgerService = inventoryLedgerService;
        this.auditLogService = auditLogService;
        this.userRepository = userRepository;
    }

    @Override
    public void enrichUsernames(List<StocktakeResponse> responses) {
        List<Long> userIds = responses.stream()
                .map(StocktakeResponse::getCreatedBy)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (userIds.isEmpty()) return;
        Map<Long, String> nameMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(
                        User::getId,
                        u -> u.getFullName() != null ? u.getFullName() : u.getUsername()));
        responses.forEach(r -> {
            if (r.getCreatedBy() != null) {
                r.setCreatedByUsername(nameMap.getOrDefault(r.getCreatedBy(), "—"));
            }
        });
    }

    @Override
    public Stocktake create(CreateStocktakeRequest request) {
        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy kho"));

        Stocktake stocktake = Stocktake.builder()
                .location(location)
                .createdBy(SecurityUtils.getCurrentUserId().orElse(null))
                .stocktakeDate(LocalDateTime.now())
                .status(StocktakeStatus.DRAFT)
                .note(request.getNote())
                .build();

        for (StocktakeLineRequest line : request.getItems()) {
            Item item = itemService.findItem(line.getItemId());
            ItemLot lot = line.getLotId() != null
                    ? itemLotRepository.findById(line.getLotId())
                            .orElseThrow(() -> new NotFoundException("Không tìm thấy lô"))
                    : null;
            if (lot != null && !lot.getItem().getId().equals(item.getId())) {
                throw new BadRequestException("Lô không thuộc sản phẩm kiểm kê");
            }

            BigDecimal systemQty = getExactSystemQuantity(item.getId(), location.getId(), line.getLotId());

            BigDecimal actualQty = line.getActualQuantity() != null ? line.getActualQuantity() : systemQty;
            BigDecimal variance = actualQty.subtract(systemQty);

            stocktake.getItems().add(StocktakeItem.builder()
                    .stocktake(stocktake)
                    .item(item)
                    .lot(lot)
                    .systemQuantity(systemQty)
                    .actualQuantity(actualQty)
                    .variance(variance)
                    .note(line.getNote())
                    .build());
        }

        Stocktake saved = stocktakeRepository.save(stocktake);
        auditLogService.log(
                AuditAction.STOCKTAKE_CREATE,
                "STOCKTAKE",
                saved.getId().toString(),
                "Tạo phiếu kiểm kê #" + saved.getId(),
                null,
                AuditData.of("locationId", location.getId(), "status", saved.getStatus())
        );
        return saved;
    }

    @Override
    public Stocktake confirm(Long id) {
        return confirm(id, null);
    }

    @Override
    public Stocktake confirm(Long id, ConfirmStocktakeRequest request) {
        Stocktake stocktake = findById(id);
        if (stocktake.getStatus() != StocktakeStatus.DRAFT) {
            throw new BadRequestException("Chỉ có thể xác nhận phiếu kiểm kê ở trạng thái DRAFT");
        }

        if (request != null && request.getItems() != null) {
            for (StocktakeLineRequest update : request.getItems()) {
                stocktake.getItems().stream()
                        .filter(line -> line.getItem().getId().equals(update.getItemId())
                                && ((update.getLotId() == null && line.getLot() == null)
                                || (line.getLot() != null && line.getLot().getId().equals(update.getLotId()))))
                        .findFirst()
                        .ifPresent(line -> {
                            if (update.getActualQuantity() != null) {
                                line.setActualQuantity(update.getActualQuantity());
                            }
                        });
            }
        }

        Long userId = SecurityUtils.getCurrentUserId().orElse(null);
        for (StocktakeItem line : stocktake.getItems()) {
            BigDecimal freshSystemQty = getExactSystemQuantity(
                    line.getItem().getId(),
                    stocktake.getLocation().getId(),
                    line.getLot() != null ? line.getLot().getId() : null);

            line.setSystemQuantity(freshSystemQty);
            BigDecimal actualQty = line.getActualQuantity() != null ? line.getActualQuantity() : freshSystemQty;
            BigDecimal variance = actualQty.subtract(freshSystemQty);
            line.setVariance(variance);

            if (variance.compareTo(BigDecimal.ZERO) == 0) {
                continue;
            }
            inventoryLedgerService.applyMovement(
                    line.getItem(),
                    stocktake.getLocation(),
                    line.getLot(),
                    variance,
                    InventoryActionType.ADJUSTMENT,
                    ReferenceType.STOCKTAKE,
                    stocktake.getId(),
                    userId,
                    "Kiểm kê: chênh lệch " + variance
            );
        }

        stocktake.setStatus(StocktakeStatus.CONFIRMED);
        stocktake.setConfirmedAt(LocalDateTime.now());
        Stocktake saved = stocktakeRepository.save(stocktake);

        auditLogService.log(
                AuditAction.STOCKTAKE_CONFIRM,
                "STOCKTAKE",
                saved.getId().toString(),
                "Xác nhận phiếu kiểm kê #" + saved.getId(),
                AuditData.of("status", StocktakeStatus.DRAFT),
                AuditData.of("status", saved.getStatus())
        );
        return saved;
    }

    @Override
    public Stocktake cancel(Long id) {
        Stocktake stocktake = findById(id);
        if (stocktake.getStatus() != StocktakeStatus.DRAFT) {
            throw new BadRequestException("Chỉ có thể hủy phiếu kiểm kê ở trạng thái DRAFT");
        }
        stocktake.setStatus(StocktakeStatus.CANCELLED);
        Stocktake saved = stocktakeRepository.save(stocktake);
        auditLogService.log(
                AuditAction.STOCKTAKE_CANCEL,
                "STOCKTAKE",
                saved.getId().toString(),
                "Hủy phiếu kiểm kê #" + saved.getId(),
                AuditData.of("status", StocktakeStatus.DRAFT),
                AuditData.of("status", saved.getStatus())
        );
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Stocktake findById(Long id) {
        return stocktakeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu kiểm kê"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Stocktake> listAll(StocktakeStatus status) {
        if (status != null) {
            return stocktakeRepository.findByStatusOrderByIdDesc(status);
        }
        return stocktakeRepository.findAllByOrderByIdDesc();
    }

    private BigDecimal getExactSystemQuantity(Long itemId, Long locationId, Long lotId) {
        return currentInventoryRepository.findByItemLocationLot(itemId, locationId, lotId)
                .map(CurrentInventory::getQuantity)
                .orElse(BigDecimal.ZERO);
    }
}
