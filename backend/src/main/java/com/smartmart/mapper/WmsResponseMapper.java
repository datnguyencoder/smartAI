package com.smartmart.mapper;

import com.smartmart.dto.response.*;
import com.smartmart.entity.*;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.util.List;

public final class WmsResponseMapper {

    private WmsResponseMapper() {
    }

    public static InventoryResponse toInventoryResponse(CurrentInventory inv) {
        BigDecimal available = inv.getQuantity().subtract(inv.getReservedQuantity());
        ItemLot lot = inv.getLot();
        return InventoryResponse.builder()
                .id(inv.getId())
                .itemId(inv.getItem().getId())
                .itemCode(inv.getItem().getItemCode())
                .itemName(inv.getItem().getItemName())
                .locationId(inv.getLocation().getId())
                .locationName(inv.getLocation().getLocationName())
                .lotId(lot != null ? lot.getId() : null)
                .lotNumber(lot != null ? lot.getLotNumber() : null)
                .expiryDate(lot != null ? lot.getExpiryDate() : null)
                .quantity(inv.getQuantity())
                .reservedQuantity(inv.getReservedQuantity())
                .availableQuantity(available)
                .build();
    }

    public static List<InventoryResponse> toInventoryResponses(List<CurrentInventory> list) {
        return list.stream().map(WmsResponseMapper::toInventoryResponse).toList();
    }

    public static InventoryLogResponse toInventoryLogResponse(InventoryLog log) {
        return InventoryLogResponse.builder()
                .id(log.getId())
                .itemId(log.getItem().getId())
                .itemName(log.getItem().getItemName())
                .locationId(log.getLocation().getId())
                .locationName(log.getLocation().getLocationName())
                .userId(log.getUserId())
                .referenceType(log.getReferenceType())
                .referenceId(log.getReferenceId())
                .actionType(log.getActionType())
                .quantityBefore(log.getQuantityBefore())
                .quantityChange(log.getQuantityChange())
                .quantityAfter(log.getQuantityAfter())
                .note(log.getNote())
                .createdAt(log.getCreatedAt())
                .build();
    }

    public static Page<InventoryLogResponse> toInventoryLogPage(Page<InventoryLog> page) {
        return page.map(WmsResponseMapper::toInventoryLogResponse);
    }

    public static InventoryAlertResponse toInventoryAlertResponse(InventoryAlert alert) {
        Item item = alert.getItem();
        return InventoryAlertResponse.builder()
                .id(alert.getId())
                .itemId(item.getId())
                .itemCode(item.getItemCode())
                .itemName(item.getItemName())
                .alertType(alert.getAlertType())
                .severity(alert.getSeverity())
                .message(alert.getMessage())
                .resolved(alert.isResolved())
                .createdAt(alert.getCreatedAt())
                .build();
    }

    public static List<InventoryAlertResponse> toInventoryAlertResponses(List<InventoryAlert> list) {
        return list.stream().map(WmsResponseMapper::toInventoryAlertResponse).toList();
    }

    public static ScrapOrderResponse toScrapOrderResponse(ScrapOrder order) {
        List<ScrapOrderItemResponse> items = order.getItems().stream()
                .map(i -> ScrapOrderItemResponse.builder()
                        .itemId(i.getItem().getId())
                        .itemName(i.getItem().getItemName())
                        .lotId(i.getLot() != null ? i.getLot().getId() : null)
                        .lotNumber(i.getLot() != null ? i.getLot().getLotNumber() : null)
                        .quantity(i.getQuantity())
                        .reason(i.getReason())
                        .build())
                .toList();
        return ScrapOrderResponse.builder()
                .id(order.getId())
                .locationId(order.getLocation().getId())
                .locationName(order.getLocation().getLocationName())
                .createdBy(order.getCreatedBy())
                .scrapDate(order.getScrapDate())
                .status(order.getStatus())
                .note(order.getNote())
                .items(items)
                .build();
    }

    public static List<ScrapOrderResponse> toScrapOrderResponses(List<ScrapOrder> list) {
        return list.stream().map(WmsResponseMapper::toScrapOrderResponse).toList();
    }
}
