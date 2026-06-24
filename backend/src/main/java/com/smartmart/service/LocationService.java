package com.smartmart.service;

import com.smartmart.dto.request.CreateLocationRequest;
import com.smartmart.dto.request.UpdateLocationRequest;
import com.smartmart.dto.response.LocationResponse;

import java.util.List;

public interface LocationService {

    List<LocationResponse> listAll(String q, String type, Boolean active);

    LocationResponse create(CreateLocationRequest req);

    LocationResponse update(Long id, UpdateLocationRequest req);
}
