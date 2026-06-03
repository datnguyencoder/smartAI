package com.smartmart.service;

import com.smartmart.dto.request.CreateSupplierRequest;
import com.smartmart.dto.response.SupplierResponse;

import java.util.List;

public interface SupplierService {

    List<SupplierResponse> listAll();

    SupplierResponse create(CreateSupplierRequest req);
}
