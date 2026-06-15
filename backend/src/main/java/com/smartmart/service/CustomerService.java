package com.smartmart.service;

import com.smartmart.dto.request.CreateCustomerRequest;
import com.smartmart.dto.request.UpdateCustomerRequest;
import com.smartmart.dto.response.CustomerResponse;
import com.smartmart.entity.Customer;

import java.math.BigDecimal;
import java.util.List;

public interface CustomerService {

    List<CustomerResponse> search(String phone, String q);

    CustomerResponse getById(Long id);

    CustomerResponse getByPhone(String phone);

    CustomerResponse create(CreateCustomerRequest request);

    CustomerResponse update(Long id, UpdateCustomerRequest request);

    Customer findOrCreateByPhone(String phone, String fullName);

    void awardPoints(Long customerId, BigDecimal orderTotalVnd);

    BigDecimal redeemPoints(Long customerId, int pointsToRedeem);
}
