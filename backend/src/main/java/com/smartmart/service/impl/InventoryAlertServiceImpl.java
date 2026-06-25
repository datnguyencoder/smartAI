package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.response.InventoryAlertResponse;
import com.smartmart.entity.CurrentInventory;
import com.smartmart.entity.ForecastResult;
import com.smartmart.entity.InventoryAlert;
import com.smartmart.entity.Item;
import com.smartmart.enums.AlertSeverity;
import com.smartmart.enums.AlertType;
import com.smartmart.exception.NotFoundException;
import com.smartmart.mapper.WmsResponseMapper;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.repository.ForecastResultRepository;
import com.smartmart.repository.InventoryAlertRepository;
import com.smartmart.repository.ItemRepository;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.InventoryAlertService;
import com.smartmart.util.AuditData;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class InventoryAlertServiceImpl implements InventoryAlertService {

    private static final int NEAR_EXPIRY_DAYS = 30;

    private final ItemRepository itemRepository;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final InventoryAlertRepository inventoryAlertRepository;
    private final ForecastResultRepository forecastResultRepository;
    private final AuditLogService auditLogService;

    public InventoryAlertServiceImpl(
            ItemRepository itemRepository,
            CurrentInventoryRepository currentInventoryRepository,
            InventoryAlertRepository inventoryAlertRepository,
            ForecastResultRepository forecastResultRepository,
            AuditLogService auditLogService
    ) {
        this.itemRepository = itemRepository;
        this.currentInventoryRepository = currentInventoryRepository;
        this.inventoryAlertRepository = inventoryAlertRepository;
        this.forecastResultRepository = forecastResultRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    public void evaluateStockAfterSale(Long itemId) {
        itemRepository.findById(itemId).ifPresent(this::evaluateStock);
    }

    @Override
    public void evaluateStock(Item item) {
        BigDecimal available = sumAvailable(item.getId());

        if (available.compareTo(BigDecimal.ZERO) <= 0) {
            upsertAlert(item, AlertType.OUT_OF_STOCK, AlertSeverity.CRITICAL,
                    "Sản phẩm " + item.getItemName() + " đã hết hàng");
            resolveAlerts(item.getId(), List.of(AlertType.LOW_STOCK.name(), AlertType.HIGH_RISK.name()));
        } else {
            resolveAlerts(item.getId(), List.of(AlertType.OUT_OF_STOCK.name()));
            if (available.compareTo(BigDecimal.valueOf(item.getMinimumStock())) <= 0) {
                upsertAlert(item, AlertType.LOW_STOCK, AlertSeverity.WARNING,
                        "Sản phẩm " + item.getItemName() + " sắp hết (tồn " + available.intValue() + ")");
            } else {
                resolveAlerts(item.getId(), List.of(AlertType.LOW_STOCK.name()));
            }
        }

        forecastResultRepository.findFirstByItemIdOrderByForecastDateDesc(item.getId()).ifPresent(forecast -> {
            BigDecimal pred7d = forecast.getPredictedQty7d() != null
                    ? forecast.getPredictedQty7d() : BigDecimal.ZERO;
            BigDecimal pred30d = forecast.getPredictedQty30d() != null
                    ? forecast.getPredictedQty30d() : BigDecimal.ZERO;

            if (available.compareTo(pred7d) < 0 && available.compareTo(BigDecimal.ZERO) > 0) {
                upsertAlert(item, AlertType.HIGH_RISK, AlertSeverity.WARNING,
                        "Tồn " + available.intValue() + " thấp hơn dự báo 7 ngày (" + pred7d.intValue() + ")");
            } else {
                resolveAlerts(item.getId(), List.of(AlertType.HIGH_RISK.name()));
            }

            BigDecimal overstockThreshold = pred30d.multiply(BigDecimal.valueOf(2));
            if (pred30d.compareTo(BigDecimal.ZERO) > 0 && available.compareTo(overstockThreshold) > 0) {
                upsertAlert(item, AlertType.OVERSTOCK, AlertSeverity.WARNING,
                        "Tồn " + available.intValue() + " vượt ngưỡng tồn dư (2× dự báo 30 ngày)");
            } else {
                resolveAlerts(item.getId(), List.of(AlertType.OVERSTOCK.name()));
            }
        });

        if (item.isHasExpiry()) {
            boolean hasNearExpiry = currentInventoryRepository.findNearExpiry(LocalDate.now().plusDays(NEAR_EXPIRY_DAYS))
                    .stream()
                    .anyMatch(ci -> ci.getItem().getId().equals(item.getId())
                            && ci.getQuantity().compareTo(BigDecimal.ZERO) > 0);
            if (hasNearExpiry) {
                upsertAlert(item, AlertType.NEAR_EXPIRY, AlertSeverity.WARNING,
                        "Sản phẩm " + item.getItemName() + " có lô sắp hết hạn trong 30 ngày");
            } else {
                resolveAlerts(item.getId(), List.of(AlertType.NEAR_EXPIRY.name()));
            }

            boolean hasExpired = currentInventoryRepository.findExpired().stream()
                    .anyMatch(ci -> ci.getItem().getId().equals(item.getId()));
            if (hasExpired) {
                upsertAlert(item, AlertType.EXPIRED, AlertSeverity.CRITICAL,
                        "Sản phẩm " + item.getItemName() + " có lô đã hết hạn sử dụng — cần lập phiếu hủy");
            } else {
                resolveAlerts(item.getId(), List.of(AlertType.EXPIRED.name()));
            }
        }
    }

    private BigDecimal sumAvailable(Long itemId) {
        return currentInventoryRepository.findByItemId(itemId).stream()
                .map(ci -> ci.getQuantity().subtract(ci.getReservedQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void upsertAlert(Item item, AlertType type, AlertSeverity severity, String message) {
        String typeName = type.name();
        if (inventoryAlertRepository.findFirstByItemIdAndAlertTypeAndResolvedFalse(item.getId(), typeName).isPresent()) {
            return;
        }
        InventoryAlert saved = inventoryAlertRepository.save(InventoryAlert.builder()
                .item(item)
                .alertType(typeName)
                .severity(severity.name())
                .message(message)
                .resolved(false)
                .createdAt(LocalDateTime.now())
                .build());
        auditLogService.log(
                AuditAction.INVENTORY_ALERT_CREATE,
                "INVENTORY_ALERT",
                saved.getId().toString(),
                "Tạo cảnh báo tồn kho: " + item.getItemName(),
                null,
                AuditData.of(
                        "itemId", item.getId(),
                        "alertType", saved.getAlertType(),
                        "severity", saved.getSeverity(),
                        "resolved", saved.isResolved()
                )
        );
    }

    private void resolveAlerts(Long itemId, List<String> types) {
        for (String type : types) {
            inventoryAlertRepository.findByItemIdAndAlertTypeAndResolvedFalse(itemId, type)
                    .forEach(alert -> {
                        alert.setResolved(true);
                        inventoryAlertRepository.save(alert);
                    });
        }
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
        String beforeData = AuditData.of(
                "resolved", alert.isResolved()
        );
        alert.setResolved(true);
        InventoryAlert saved = inventoryAlertRepository.save(alert);
        auditLogService.log(
                AuditAction.INVENTORY_ALERT_RESOLVE,
                "INVENTORY_ALERT",
                saved.getId().toString(),
                "Xử lý cảnh báo tồn kho #" + saved.getId(),
                beforeData,
                AuditData.of("resolved", saved.isResolved())
        );
        return WmsResponseMapper.toInventoryAlertResponse(saved);
    }
}
