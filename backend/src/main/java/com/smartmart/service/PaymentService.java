package com.smartmart.service;

import com.smartmart.dto.request.PaymentRequest;
import com.smartmart.dto.response.PaymentResponse;

public interface PaymentService {
    
    /**
     * Create a payment link using PayOS for the given order.
     */
    PaymentResponse createPaymentLink(PaymentRequest request) throws Exception;
}
