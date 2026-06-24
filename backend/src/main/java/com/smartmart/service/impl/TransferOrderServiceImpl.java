package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreateTransferOrderRequest;
import com.smartmart.dto.request.TransferLineRequest;
import com.smartmart.entity.*;
import com.smartmart.enums.ReferenceType;
import com.smartmart.enums.TransferStatus;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.InsufficientStockException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.repository.ItemLotRepository;
import com.smartmart.repository.LocationRepository;
import com.smartmart.repository.TransferOrderRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.InventoryLedgerService;
import com.smartmart.service.InventoryQueryService;
import com.smartmart.service.ItemService;
import com.smartmart.service.TransferOrderService;
import com.smartmart.util.AuditData;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class TransferOrderServiceImpl implements TransferOrderService {

    private final TransferOrderRepository transferOrderRepository;
    private final LocationRepository locationRepository;
    private final ItemLotRepository itemLotRepository;
    private final ItemService itemService;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final InventoryLedgerService inventoryLedgerService;
    private final InventoryQueryService inventoryQueryService;
    private final AuditLogService auditLogService;

    public TransferOrderServiceImpl(
            TransferOrderRepository transferOrderRepository,
            LocationRepository locationRepository,
            ItemLotRepository itemLotRepository,
            ItemService itemService,
            CurrentInventoryRepository currentInventoryRepository,
            InventoryLedgerService inventoryLedgerService,
            InventoryQueryService inventoryQueryService,
            AuditLogService auditLogService
    ) {
        this.transferOrderRepository = transferOrderRepository;
        this.locationRepository = locationRepository;
        this.itemLotRepository = itemLotRepository;
        this.itemService = itemService;
        this.currentInventoryRepository = currentInventoryRepository;
        this.inventoryLedgerService = inventoryLedgerService;
        this.inventoryQueryService = inventoryQueryService;
        this.auditLogService = auditLogService;
    }

    @Override
    public TransferOrder create(CreateTransferOrderRequest request) {
        if (request.getFromLocationId().equals(request.getToLocationId())) {
            throw new BadRequestException("Kho nguồn và kho đích phải khác nhau");
        }
        Location from = locationRepository.findById(request.getFromLocationId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy kho nguồn"));
        Location to = locationRepository.findById(request.getToLocationId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy kho đích"));

        for (TransferLineRequest line : request.getItems()) {
            BigDecimal available = inventoryQueryService.getExactAvailableQty(line.getItemId(), from.getId(), line.getLotId());
            if (available.compareTo(line.getQuantity()) < 0) {
                Item item = itemService.findItem(line.getItemId());
                throw new InsufficientStockException("Không đủ tồn kho tại kho nguồn cho: " + item.getItemName());
            }
        }

        TransferOrder transfer = TransferOrder.builder()
                .fromLocation(from)
                .toLocation(to)
                .createdBy(SecurityUtils.getCurrentUserId().orElse(null))
                .transferDate(LocalDateTime.now())
                .status(TransferStatus.PENDING)
                .note(request.getNote())
                .build();

        for (TransferLineRequest line : request.getItems()) {
            Item item = itemService.findItem(line.getItemId());
            ItemLot lot = line.getLotId() != null
                    ? itemLotRepository.findById(line.getLotId())
                            .orElseThrow(() -> new NotFoundException("Không tìm thấy lô"))
                    : null;
            if (lot != null && !lot.getItem().getId().equals(item.getId())) {
                throw new BadRequestException("Lô không thuộc sản phẩm chuyển kho");
            }
            transfer.getItems().add(TransferOrderItem.builder()
                    .transferOrder(transfer)
                    .item(item)
                    .lot(lot)
                    .quantity(line.getQuantity())
                    .note(line.getNote())
                    .build());
        }

        TransferOrder saved = transferOrderRepository.save(transfer);
        auditLogService.log(
                AuditAction.TRANSFER_CREATE,
                "TRANSFER_ORDER",
                saved.getId().toString(),
                "Tạo phiếu chuyển kho #" + saved.getId(),
                null,
                AuditData.of("fromLocationId", from.getId(), "toLocationId", to.getId())
        );
        return saved;
    }

    @Override
    public TransferOrder complete(Long id) {
        TransferOrder transfer = findById(id);
        if (transfer.getStatus() != TransferStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể hoàn thành phiếu chuyển kho đang chờ");
        }

        Long userId = SecurityUtils.getCurrentUserId().orElse(null);
        for (TransferOrderItem line : transfer.getItems()) {
            Long lotId = line.getLot() != null ? line.getLot().getId() : null;
            currentInventoryRepository.findFilteredForUpdate(
                    line.getItem().getId(), transfer.getFromLocation().getId(), lotId);

            BigDecimal available = inventoryQueryService.getExactAvailableQty(
                    line.getItem().getId(),
                    transfer.getFromLocation().getId(),
                    lotId);
            if (available.compareTo(line.getQuantity()) < 0) {
                throw new InsufficientStockException(
                        "Không đủ tồn kho tại kho nguồn cho: " + line.getItem().getItemName());
            }

            inventoryLedgerService.applyTransfer(
                    line.getItem(),
                    line.getLot(),
                    transfer.getFromLocation(),
                    transfer.getToLocation(),
                    line.getQuantity(),
                    ReferenceType.TRANSFER_ORDER,
                    transfer.getId(),
                    userId,
                    line.getNote()
            );
        }

        transfer.setStatus(TransferStatus.COMPLETED);
        transfer.setCompletedAt(LocalDateTime.now());
        TransferOrder saved = transferOrderRepository.save(transfer);

        auditLogService.log(
                AuditAction.TRANSFER_COMPLETE,
                "TRANSFER_ORDER",
                saved.getId().toString(),
                "Hoàn thành phiếu chuyển kho #" + saved.getId(),
                AuditData.of("status", TransferStatus.PENDING),
                AuditData.of("status", saved.getStatus())
        );
        return saved;
    }

    @Override
    public TransferOrder cancel(Long id) {
        TransferOrder transfer = findById(id);
        if (transfer.getStatus() != TransferStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể hủy phiếu chuyển kho đang chờ");
        }
        transfer.setStatus(TransferStatus.CANCELLED);
        TransferOrder saved = transferOrderRepository.save(transfer);
        auditLogService.log(
                AuditAction.TRANSFER_CANCEL,
                "TRANSFER_ORDER",
                saved.getId().toString(),
                "Hủy phiếu chuyển kho #" + saved.getId(),
                AuditData.of("status", TransferStatus.PENDING),
                AuditData.of("status", saved.getStatus())
        );
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public TransferOrder findById(Long id) {
        TransferOrder order = transferOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu chuyển kho"));
        for (TransferOrderItem item : order.getItems()) {
            if (item.getItem() != null) item.getItem().getItemName();
            if (item.getLot() != null) item.getLot().getLotNumber();
        }
        return order;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransferOrder> listAll(TransferStatus status) {
        List<TransferOrder> list;
        if (status != null) {
            list = transferOrderRepository.findByStatusOrderByIdDesc(status);
        } else {
            list = transferOrderRepository.findAllByOrderByIdDesc();
        }
        for (TransferOrder order : list) {
            for (TransferOrderItem item : order.getItems()) {
                if (item.getItem() != null) item.getItem().getItemName();
                if (item.getLot() != null) item.getLot().getLotNumber();
            }
        }
        return list;
    }

}
