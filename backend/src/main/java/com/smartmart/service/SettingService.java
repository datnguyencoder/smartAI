package com.smartmart.service;

import com.smartmart.dto.request.UpdateSettingRequest;
import com.smartmart.dto.response.SettingResponse;

import java.util.List;

public interface SettingService {

    List<SettingResponse> listAll();

    SettingResponse update(String key, UpdateSettingRequest request);

    String getValue(String key, String defaultValue);

    int getIntValue(String key, int defaultValue);
}
