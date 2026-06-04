package com.smartmart.service.impl;

import com.smartmart.dto.response.InventoryAlertResponse;
import com.smartmart.entity.InventoryAlert;
import com.smartmart.entity.Item;
import com.smartmart.enums.AlertSeverity;
import com.smartmart.enums.AlertType;
import com.smartmart.exception.NotFoundException;
import com.smartmart.mapper.WmsResponseMapper;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.repository.InventoryAlertRepository;
import com.smartmart.repository.ItemRepository;
import com.smartmart.service.InventoryAlertService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class InventoryAlertServiceImpl implements InventoryAlertService {

    private final ItemRepository itemRepository;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final InventoryAlertRepository inventoryAlertRepository;

    public InventoryAlertServiceImpl(
            ItemRepository itemRepository,
            CurrentInventoryRepository currentInventoryRepository,
            InventoryAlertRepository inventoryAlertRepository
    ) {
        this.itemRepository = itemRepository;
        this.currentInventoryRepository = currentInventoryRepository;
        this.inventoryAlertRepository = inventoryAlertRepository;
    }

    @Override
    public void evaluateStockAfterSale(Long itemId) {
        itemRepository.findById(itemId).ifPresent(this::evaluateStock);
    }

    @Override
    public void evaluateStock(Item item) {
        BigDecimal available = currentInventoryRepository.findByItemId(item.getId()).stream()
                .map(ci -> ci.getQuantity().subtract(ci.getReservedQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (available.compareTo(BigDecimal.ZERO) <= 0) {
            upsertAlert(item, AlertType.OUT_OF_STOCK, AlertSeverity.CRITICAL,
                    "Sản phẩm " + item.getItemName() + " đã hết hàng");
        } else if (available.compareTo(BigDecimal.valueOf(item.getMinimumStock())) <= 0) {
            upsertAlert(item, AlertType.LOW_STOCK, AlertSeverity.WARNING,
                    "Sản phẩm " + item.getItemName() + " sắp hết (tồn " + available.intValue() + ")");
        }
    }

    private void upsertAlert(Item item, AlertType type, AlertSeverity severity, String message) {
        String typeName = type.name();
        if (inventoryAlertRepository.findFirstByItemIdAndAlertTypeAndResolvedFalse(item.getId(), typeName).isPresent()) {
            return;
        }
        inventoryAlertRepository.save(InventoryAlert.builder()
                .item(item)
                .alertType(typeName)
                .severity(severity.name())
                .message(message)
                .resolved(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryAlertResponse> listUnresolved() {
        return WmsResponseMapper.toInventoryAlertResponses(
                inventoryAlertRepository.findByResolvedFalseOrderByCreatedAtDesc());
    }

    @Override
    public InventoryAlertResponse resolve(Long alertId) {
        InventoryAlert alert = inventoryAlertRepository.findById(alertId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy cảnh báo"));
        alert.setResolved(true);
        return WmsResponseMapper.toInventoryAlertResponse(inventoryAlertRepository.save(alert));
    }
}
