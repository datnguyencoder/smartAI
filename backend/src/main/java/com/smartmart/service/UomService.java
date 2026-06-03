package com.smartmart.service;

import com.smartmart.dto.request.CreateUomRequest;
import com.smartmart.dto.response.UomResponse;

import java.util.List;

public interface UomService {

    List<UomResponse> listAll();

    UomResponse create(CreateUomRequest req);
}
