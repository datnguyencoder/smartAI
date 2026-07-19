package com.smartmart.service.impl;

import com.smartmart.dto.request.UpdateSettingRequest;
import com.smartmart.dto.response.SettingResponse;
import com.smartmart.entity.Setting;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.SettingRepository;
import com.smartmart.service.SettingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SettingServiceImpl implements SettingService {

    private final SettingRepository settingRepository;

    public SettingServiceImpl(SettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    @Transactional(readOnly = true)
    @Override
    public List<SettingResponse> listAll() {
        return settingRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public SettingResponse update(String key, UpdateSettingRequest request) {
        Setting setting = settingRepository.findByKey(key)
                .orElseGet(() -> Setting.builder().key(key).value("").build());
        setting.setValue(request.getValue());
        if (request.getDescription() != null) {
            setting.setDescription(request.getDescription());
        }
        return toResponse(settingRepository.save(setting));
    }

    @Transactional(readOnly = true)
    @Override
    public String getValue(String key, String defaultValue) {
        return settingRepository.findByKey(key)
                .map(Setting::getValue)
                .orElse(defaultValue);
    }

    @Transactional(readOnly = true)
    @Override
    public int getIntValue(String key, int defaultValue) {
        String raw = getValue(key, String.valueOf(defaultValue));
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }

    private SettingResponse toResponse(Setting setting) {
        return SettingResponse.builder()
                .id(setting.getId())
                .key(setting.getKey())
                .value(setting.getValue())
                .description(setting.getDescription())
                .build();
    }
}
