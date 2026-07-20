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
import com.smartmart.repository.ItemRepository;
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
import java.util.ArrayList;
import java.util.Comparator;
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
    private final ItemRepository itemRepository;

    public StocktakeServiceImpl(
            StocktakeRepository stocktakeRepository,
            LocationRepository locationRepository,
            ItemLotRepository itemLotRepository,
            ItemService itemService,
            CurrentInventoryRepository currentInventoryRepository,
            InventoryLedgerService inventoryLedgerService,
            AuditLogService auditLogService,
            UserRepository userRepository,
            ItemRepository itemRepository
    ) {
        this.stocktakeRepository = stocktakeRepository;
        this.locationRepository = locationRepository;
        this.itemLotRepository = itemLotRepository;
        this.itemService = itemService;
        this.currentInventoryRepository = currentInventoryRepository;
        this.inventoryLedgerService = inventoryLedgerService;
        this.auditLogService = auditLogService;
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
    }

    @Override
    public void enrichUsernames(List<StocktakeResponse> responses) {
        List<Long> userIds = responses.stream()
                .flatMap(response -> java.util.stream.Stream.of(
                        response.getCreatedBy(),
                        response.getSubmittedBy(),
                        response.getApprovedBy()))
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
            if (r.getSubmittedBy() != null) {
                r.setSubmittedByUsername(nameMap.getOrDefault(r.getSubmittedBy(), "—"));
            }
            if (r.getApprovedBy() != null) {
                r.setApprovedByUsername(nameMap.getOrDefault(r.getApprovedBy(), "—"));
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
    public Stocktake submitForApproval(Long id, ConfirmStocktakeRequest request) {
        Stocktake stocktake = findById(id);
        if (stocktake.getStatus() != StocktakeStatus.DRAFT) {
            throw new BadRequestException("Chỉ có thể chốt phiếu kiểm kê đang ở trạng thái nháp");
        }

        if (request != null && request.getItems() != null) {
            for (StocktakeLineRequest update : request.getItems()) {
                StocktakeItem matchedLine = stocktake.getItems().stream()
                        .filter(line -> line.getItem().getId().equals(update.getItemId())
                                && ((update.getLotId() == null && line.getLot() == null)
                                || (line.getLot() != null && line.getLot().getId().equals(update.getLotId()))))
                        .findFirst()
                        .orElseThrow(() -> new BadRequestException("Dòng kiểm kê không thuộc phiếu này"));
                if (update.getActualQuantity() == null) {
                    throw new BadRequestException("Số lượng thực tế không được để trống");
                }
                matchedLine.setActualQuantity(update.getActualQuantity());
            }
        }

        List<StocktakeItem> sortedItems = new ArrayList<>(stocktake.getItems());
        sortedItems.sort(Comparator.comparing(line -> line.getItem().getId()));
        for (StocktakeItem line : sortedItems) {
            itemRepository.findByIdWithPessimisticLock(line.getItem().getId());
            if (line.getActualQuantity() == null) {
                throw new BadRequestException("Phải nhập đủ số lượng thực tế trước khi chốt");
            }
            BigDecimal freshSystemQty = getExactSystemQuantity(
                    line.getItem().getId(),
                    stocktake.getLocation().getId(),
                    line.getLot() != null ? line.getLot().getId() : null);
            line.setSystemQuantity(freshSystemQty);
            line.setVariance(line.getActualQuantity().subtract(freshSystemQty));
        }

        stocktake.setStatus(StocktakeStatus.PENDING_APPROVAL);
        stocktake.setSubmittedBy(SecurityUtils.getCurrentUserId().orElse(null));
        stocktake.setSubmittedAt(LocalDateTime.now());
        Stocktake saved = stocktakeRepository.save(stocktake);

        auditLogService.log(
                AuditAction.STOCKTAKE_SUBMIT,
                "STOCKTAKE",
                saved.getId().toString(),
                "Chốt số đếm kiểm kê #" + saved.getId() + " và gửi Manager duyệt",
                AuditData.of("status", StocktakeStatus.DRAFT),
                AuditData.of("status", saved.getStatus())
        );
        return saved;
    }

    @Override
    public Stocktake approve(Long id) {
        Stocktake stocktake = findById(id);
        if (stocktake.getStatus() != StocktakeStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Chỉ có thể duyệt phiếu đang chờ Manager duyệt");
        }

        Long userId = SecurityUtils.getCurrentUserId().orElse(null);
        List<StocktakeItem> sortedItems = new ArrayList<>(stocktake.getItems());
        sortedItems.sort(Comparator.comparing(line -> line.getItem().getId()));
        for (StocktakeItem line : sortedItems) {
            itemRepository.findByIdWithPessimisticLock(line.getItem().getId());
        }

        for (StocktakeItem line : sortedItems) {
            BigDecimal freshSystemQty = getExactSystemQuantity(
                    line.getItem().getId(),
                    stocktake.getLocation().getId(),
                    line.getLot() != null ? line.getLot().getId() : null);
            BigDecimal actualQty = line.getActualQuantity();
            BigDecimal variance = actualQty.subtract(freshSystemQty);
            line.setSystemQuantity(freshSystemQty);
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
                    "Manager duyệt kiểm kê: đặt tồn thực tế về " + actualQty
            );
        }

        stocktake.setStatus(StocktakeStatus.CONFIRMED);
        stocktake.setApprovedBy(userId);
        stocktake.setConfirmedAt(LocalDateTime.now());
        Stocktake saved = stocktakeRepository.save(stocktake);

        auditLogService.log(
                AuditAction.STOCKTAKE_APPROVE,
                "STOCKTAKE",
                saved.getId().toString(),
                "Manager duyệt phiếu kiểm kê #" + saved.getId() + " và cập nhật tồn kho",
                AuditData.of("status", StocktakeStatus.PENDING_APPROVAL),
                AuditData.of("status", saved.getStatus())
        );
        return saved;
    }

    @Override
    public Stocktake cancel(Long id) {
        Stocktake stocktake = findById(id);
        if (stocktake.getStatus() != StocktakeStatus.DRAFT
                && stocktake.getStatus() != StocktakeStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Chỉ có thể hủy phiếu nháp hoặc phiếu đang chờ duyệt");
        }
        StocktakeStatus previousStatus = stocktake.getStatus();
        stocktake.setStatus(StocktakeStatus.CANCELLED);
        Stocktake saved = stocktakeRepository.save(stocktake);
        auditLogService.log(
                AuditAction.STOCKTAKE_CANCEL,
                "STOCKTAKE",
                saved.getId().toString(),
                "Hủy phiếu kiểm kê #" + saved.getId(),
                AuditData.of("status", previousStatus),
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
