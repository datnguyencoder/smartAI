package com.smartmart.service;

import com.smartmart.dto.request.CreateUomRequest;
import com.smartmart.dto.request.UpdateUomRequest;
import com.smartmart.dto.response.UomResponse;

import java.util.List;

public interface UomService {

    List<UomResponse> listAll();

    UomResponse create(CreateUomRequest req);

    List<UomResponse> listByCategories(String category);

    UomResponse update(Long id, UpdateUomRequest request);

    void activate(Long id);

    void deactivate(Long id);
}
