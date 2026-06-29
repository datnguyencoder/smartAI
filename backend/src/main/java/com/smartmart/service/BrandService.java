package com.smartmart.service;

import com.smartmart.dto.request.CreateBrandRequest;
import com.smartmart.dto.request.UpdateBrandRequest;
import com.smartmart.dto.response.BrandResponse;

import java.util.List;

public interface BrandService {
    BrandResponse create(CreateBrandRequest request);

    BrandResponse update(Long id, UpdateBrandRequest request);

    BrandResponse getById(Long id);

    List<BrandResponse> listAll();
}
