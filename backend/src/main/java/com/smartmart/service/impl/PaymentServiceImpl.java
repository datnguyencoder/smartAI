package com.smartmart.service.impl;

import com.smartmart.dto.request.PaymentRequest;
import com.smartmart.dto.response.PaymentResponse;
import com.smartmart.entity.Order;
import com.smartmart.entity.OrderPayment;
import com.smartmart.enums.PaymentMethod;
import com.smartmart.repository.OrderPaymentRepository;
import com.smartmart.repository.OrderRepository;
import com.smartmart.service.PaymentService;
import com.smartmart.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import java.util.List;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

        private final PayOS payOS;
        private final OrderRepository orderRepository;
        private final OrderPaymentRepository orderPaymentRepository;

        @Value("${app.frontend-url:http://localhost:5173}")
        private String frontendUrl;

        @Override
        @Transactional
        public PaymentResponse createPaymentLink(PaymentRequest request) throws Exception {
                log.info("Creating payment link for order ID: {}", request.getOrderId());

                Order order = orderRepository.findById(request.getOrderId())
                                .orElseThrow(() -> new NotFoundException(
                                                "Không tìm thấy đơn hàng với ID: " + request.getOrderId()));

                long payosOrderCode = Long.parseLong(System.currentTimeMillis() / 1000 + String.valueOf(order.getId()));

                order.setPayosOrderCode(payosOrderCode);
                orderRepository.save(order);

                PaymentLinkItem item = PaymentLinkItem.builder()
                                .name("Thanh toán đơn hàng " + order.getOrderCode())
                                .price(order.getTotalAmount().longValue())
                                .quantity(1)
                                .build();

                CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                                .orderCode(payosOrderCode)
                                .amount(order.getTotalAmount().longValue())
                                .description(("TT " + order.getOrderCode()).length() > 25 ? ("TT " + order.getOrderCode()).substring(0, 25) : "TT " + order.getOrderCode())
                                .returnUrl(frontendUrl + "/payment-success")
                                .cancelUrl(frontendUrl + "/payment-cancel")
                                .items(List.of(item))
                                .build();

                CreatePaymentLinkResponse data = payOS.paymentRequests().create(paymentData);
                log.info("Tạo link thanh toán thành công: {}", data.getCheckoutUrl());

                OrderPayment orderPayment = OrderPayment.builder()
                                .order(order)
                                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                                .amount(order.getTotalAmount())
                                .createdAt(LocalDateTime.now())
                                .paymentLinkId(data.getPaymentLinkId())
                                .checkoutUrl(data.getCheckoutUrl())
                                .build();

                orderPaymentRepository.save(orderPayment);

                return PaymentResponse.builder()
                                .checkoutUrl(data.getCheckoutUrl())
                                .qrCode(data.getQrCode())
                                .build();
        }
}
