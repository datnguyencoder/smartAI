package com.smartmart.service;

import com.smartmart.dto.request.CreateSupplierItemRequest;
import com.smartmart.dto.request.UpdateSupplierItemRequest;
import com.smartmart.dto.response.ItemResponse;
import com.smartmart.dto.response.SupplierItemResponse;

import java.util.List;

public interface SupplierItemService {
    SupplierItemResponse create(CreateSupplierItemRequest request);

    SupplierItemResponse update(Long id, UpdateSupplierItemRequest request);

    void deactivate(Long id);

    List<SupplierItemResponse> listBySupplier(Long supplierId);

    List<ItemResponse> listItemsBySupplier(Long supplierId);

    void validateItemSuppliedBySupplier(Long supplierId, String skuItem);

    void activate(Long id);
}
