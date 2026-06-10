package com.smartmart.service;

import com.smartmart.dto.request.CreateSupplierRequest;
import com.smartmart.dto.response.SupplierResponse;

import java.util.List;

public interface SupplierService {

    List<SupplierResponse> listAll(String q, Boolean active);

    SupplierResponse create(CreateSupplierRequest req);

    SupplierResponse update(Long id, com.smartmart.dto.request.UpdateSupplierRequest req);
}
