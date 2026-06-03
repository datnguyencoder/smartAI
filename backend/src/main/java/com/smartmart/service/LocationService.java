package com.smartmart.service;

import com.smartmart.dto.request.CreateLocationRequest;
import com.smartmart.dto.response.LocationResponse;

import java.util.List;

public interface LocationService {

    List<LocationResponse> listAll();

    LocationResponse create(CreateLocationRequest req);
}
