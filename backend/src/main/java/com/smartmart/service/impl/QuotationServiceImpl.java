package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateOrderRequest;
import com.smartmart.dto.request.CreateQuotationRequest;
import com.smartmart.dto.request.OrderLineRequest;
import com.smartmart.dto.request.QuotationLineRequest;
import com.smartmart.dto.response.OrderResponse;
import com.smartmart.dto.response.QuotationItemResponse;
import com.smartmart.dto.response.QuotationResponse;
import com.smartmart.entity.Item;
import com.smartmart.entity.Quotation;
import com.smartmart.entity.QuotationItem;
import com.smartmart.enums.QuotationStatus;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.QuotationRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.ItemService;
import com.smartmart.service.OrderService;
import com.smartmart.service.QuotationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class QuotationServiceImpl implements QuotationService {

    private final QuotationRepository quotationRepository;
    private final ItemService itemService;
    private final OrderService orderService;

    public QuotationServiceImpl(
            QuotationRepository quotationRepository,
            ItemService itemService,
            OrderService orderService) {
        this.quotationRepository = quotationRepository;
        this.itemService = itemService;
        this.orderService = orderService;
    }

    @Override
    public QuotationResponse create(CreateQuotationRequest request) {
        Quotation quotation = Quotation.builder()
                .quoteCode("QT-" + System.currentTimeMillis())
                .customerName(blankToNull(request.getCustomerName()))
                .customerPhone(blankToNull(request.getCustomerPhone()))
                .status(QuotationStatus.DRAFT)
                .subtotalAmount(BigDecimal.ZERO)
                .validUntil(request.getValidUntil())
                .note(blankToNull(request.getNote()))
                .createdBy(SecurityUtils.getCurrentUserId().orElse(null))
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        for (QuotationLineRequest line : request.getItems()) {
            Item item = itemService.findItem(line.getItemId());
            BigDecimal unitPrice = line.getUnitPrice() != null ? line.getUnitPrice() : item.getSellingPrice();
            BigDecimal lineTotal = unitPrice.multiply(line.getQuantity());
            quotation.getItems().add(QuotationItem.builder()
                    .quotation(quotation)
                    .item(item)
                    .quantity(line.getQuantity())
                    .unitPrice(unitPrice)
                    .subtotal(lineTotal)
                    .build());
            subtotal = subtotal.add(lineTotal);
        }
        quotation.setSubtotalAmount(subtotal);
        return toResponse(quotationRepository.save(quotation));
    }

    @Override
    @Transactional(readOnly = true)
    public QuotationResponse getById(Long id) {
        return toResponse(findWithDetails(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuotationResponse> listAll() {
        return quotationRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse).toList();
    }

    @Override
    public OrderResponse convertToOrder(Long id) {
        Quotation quotation = findWithDetails(id);
        if (quotation.getStatus() == QuotationStatus.CONVERTED) {
            throw new BadRequestException("Báo giá đã được chuyển thành đơn hàng");
        }
        if (quotation.getStatus() == QuotationStatus.CANCELLED) {
            throw new BadRequestException("Báo giá đã bị hủy");
        }

        CreateOrderRequest orderRequest = new CreateOrderRequest();
        orderRequest.setCustomerName(quotation.getCustomerName());
        orderRequest.setCustomerPhone(quotation.getCustomerPhone());
        orderRequest.setNote(quotation.getNote());
        List<OrderLineRequest> lines = new ArrayList<>();
        for (QuotationItem qi : quotation.getItems()) {
            OrderLineRequest line = new OrderLineRequest();
            line.setItemId(qi.getItem().getId());
            line.setQuantity(qi.getQuantity());
            lines.add(line);
        }
        orderRequest.setItems(lines);

        OrderResponse order = orderService.create(orderRequest);
        quotation.setStatus(QuotationStatus.CONVERTED);
        quotation.setConvertedOrderId(order.getId());
        quotationRepository.save(quotation);
        return order;
    }

    private Quotation findWithDetails(Long id) {
        return quotationRepository.findWithDetailsById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy báo giá: " + id));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private QuotationResponse toResponse(Quotation quotation) {
        List<QuotationItemResponse> items = quotation.getItems().stream()
                .map(i -> QuotationItemResponse.builder()
                        .id(i.getId())
                        .itemId(i.getItem().getId())
                        .itemName(i.getItem().getItemName())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .subtotal(i.getSubtotal())
                        .build())
                .toList();

        return QuotationResponse.builder()
                .id(quotation.getId())
                .quoteCode(quotation.getQuoteCode())
                .customerName(quotation.getCustomerName())
                .customerPhone(quotation.getCustomerPhone())
                .status(quotation.getStatus())
                .subtotalAmount(quotation.getSubtotalAmount())
                .validUntil(quotation.getValidUntil())
                .note(quotation.getNote())
                .convertedOrderId(quotation.getConvertedOrderId())
                .createdAt(quotation.getCreatedAt())
                .items(items)
                .build();
    }
}
