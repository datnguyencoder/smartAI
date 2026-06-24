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
                return toInventoryResponse(inv, null, null);
        }

        public static InventoryResponse toInventoryResponse(
                        CurrentInventory inv,
                        Integer daysUntilExpiry,
                        BigDecimal riskQuantity) {
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
                                .daysUntilExpiry(daysUntilExpiry)
                                .riskQuantity(riskQuantity)
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

        public static StocktakeResponse toStocktakeResponse(Stocktake st) {
                List<StocktakeItemResponse> items = st.getItems().stream()
                                .map(i -> StocktakeItemResponse.builder()
                                                .itemId(i.getItem().getId())
                                                .itemName(i.getItem().getItemName())
                                                .itemCode(i.getItem().getItemCode())
                                                .lotId(i.getLot() != null ? i.getLot().getId() : null)
                                                .lotNumber(i.getLot() != null ? i.getLot().getLotNumber() : null)
                                                .systemQuantity(i.getSystemQuantity())
                                                .actualQuantity(i.getActualQuantity())
                                                .variance(i.getVariance())
                                                .note(i.getNote())
                                                .build())
                                .toList();
                return StocktakeResponse.builder()
                                .id(st.getId())
                                .locationId(st.getLocation().getId())
                                .locationName(st.getLocation().getLocationName())
                                .createdBy(st.getCreatedBy())
                                .stocktakeDate(st.getStocktakeDate())
                                .status(st.getStatus())
                                .note(st.getNote())
                                .confirmedAt(st.getConfirmedAt())
                                .items(items)
                                .build();
        }

        public static List<StocktakeResponse> toStocktakeResponses(List<Stocktake> list) {
                return list.stream().map(WmsResponseMapper::toStocktakeResponse).toList();
        }

        public static TransferOrderResponse toTransferOrderResponse(TransferOrder order) {
                List<TransferOrderItemResponse> items = order.getItems().stream()
                                .map(i -> TransferOrderItemResponse.builder()
                                                .itemId(i.getItem().getId())
                                                .itemName(i.getItem().getItemName())
                                                .lotId(i.getLot() != null ? i.getLot().getId() : null)
                                                .lotNumber(i.getLot() != null ? i.getLot().getLotNumber() : null)
                                                .quantity(i.getQuantity())
                                                .note(i.getNote())
                                                .build())
                                .toList();
                return TransferOrderResponse.builder()
                                .id(order.getId())
                                .fromLocationId(order.getFromLocation().getId())
                                .fromLocationName(order.getFromLocation().getLocationName())
                                .toLocationId(order.getToLocation().getId())
                                .toLocationName(order.getToLocation().getLocationName())
                                .createdBy(order.getCreatedBy())
                                .transferDate(order.getTransferDate())
                                .status(order.getStatus())
                                .note(order.getNote())
                                .completedAt(order.getCompletedAt())
                                .items(items)
                                .build();
        }

        public static List<TransferOrderResponse> toTransferOrderResponses(List<TransferOrder> list) {
                return list.stream().map(WmsResponseMapper::toTransferOrderResponse).toList();
        }

        public static ReturnOrderResponse toReturnOrderResponse(ReturnOrder order) {
                List<ReturnOrderItemResponse> items = order.getItems().stream()
                                .map(i -> ReturnOrderItemResponse.builder()
                                                .itemId(i.getItem().getId())
                                                .itemName(i.getItem().getItemName())
                                                .lotId(i.getLot() != null ? i.getLot().getId() : null)
                                                .lotNumber(i.getLot() != null ? i.getLot().getLotNumber() : null)
                                                .quantity(i.getQuantity())
                                                .unitPrice(i.getUnitPrice())
                                                .subtotal(i.getSubtotal())
                                                .build())
                                .toList();
                return ReturnOrderResponse.builder()
                                .id(order.getId())
                                .originalOrderId(order.getOriginalOrder().getId())
                                .originalOrderCode(order.getOriginalOrder().getOrderCode())
                                .createdBy(order.getCreatedBy())
                                .returnDate(order.getReturnDate())
                                .status(order.getStatus())
                                .reason(order.getReason())
                                .refundAmount(order.getRefundAmount())
                                .note(order.getNote())
                                .items(items)
                                .build();
        }

        public static List<ReturnOrderResponse> toReturnOrderResponses(List<ReturnOrder> list) {
                return list.stream().map(WmsResponseMapper::toReturnOrderResponse).toList();
        }

        public static ShiftResponse toShiftResponse(Shift shift, String cashierName) {
                return ShiftResponse.builder()
                                .id(shift.getId())
                                .cashierId(shift.getCashierId())
                                .cashierName(cashierName)
                                .openedAt(shift.getOpenedAt())
                                .closedAt(shift.getClosedAt())
                                .openingCash(shift.getOpeningCash())
                                .closingCash(shift.getClosingCash())
                                .expectedCash(shift.getExpectedCash())
                                .cashVariance(shift.getCashVariance())
                                .varianceReason(shift.getVarianceReason())
                                .reviewedBy(shift.getReviewedBy())
                                .reviewedAt(shift.getReviewedAt())
                                .reviewNote(shift.getReviewNote())
                                .totalOrders(shift.getTotalOrders())
                                .totalRevenue(shift.getTotalRevenue())
                                .status(shift.getStatus())
                                .note(shift.getNote())
                                .build();
        }

        public static SupplierDebtResponse toSupplierDebtResponse(SupplierDebt debt) {
                List<DebtPaymentResponse> payments = debt.getPayments().stream()
                                .map(p -> DebtPaymentResponse.builder()
                                                .id(p.getId())
                                                .amount(p.getAmount())
                                                .paymentDate(p.getPaymentDate())
                                                .paymentMethod(p.getPaymentMethod())
                                                .note(p.getNote())
                                                .createdBy(p.getCreatedBy())
                                                .build())
                                .toList();
                BigDecimal remaining = debt.getAmount().subtract(debt.getPaidAmount());
                return SupplierDebtResponse.builder()
                                .id(debt.getId())
                                .supplierId(debt.getSupplier().getId())
                                .supplierName(debt.getSupplier().getSupplierName())
                                .purchaseOrderId(debt.getPurchaseOrder() != null ? debt.getPurchaseOrder().getId()
                                                : null)
                                .amount(debt.getAmount())
                                .paidAmount(debt.getPaidAmount())
                                .remainingAmount(remaining)
                                .dueDate(debt.getDueDate())
                                .status(debt.getStatus())
                                .note(debt.getNote())
                                .payments(payments)
                                .build();
        }

        public static List<SupplierDebtResponse> toSupplierDebtResponses(List<SupplierDebt> list) {
                return list.stream().map(WmsResponseMapper::toSupplierDebtResponse).toList();
        }
}
