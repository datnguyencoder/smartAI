package com.smartmart.service;

import com.smartmart.dto.request.CreateDebtPaymentRequest;
import com.smartmart.dto.response.CustomerDebtResponse;
import com.smartmart.entity.Customer;
import com.smartmart.entity.CustomerDebt;
import com.smartmart.entity.Order;
import com.smartmart.enums.CustomerDebtStatus;

import java.util.List;

public interface CustomerDebtService {
    CustomerDebt createFromOrder(Order order, Customer customer);

    List<CustomerDebtResponse> listAll(CustomerDebtStatus status);

    List<CustomerDebtResponse> listByCustomer(Long customerId);

    CustomerDebtResponse getById(Long id);

    CustomerDebtResponse recordPayment(Long id, CreateDebtPaymentRequest request);
}
