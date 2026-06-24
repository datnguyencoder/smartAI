package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreateLocationRequest;
import com.smartmart.dto.response.LocationResponse;
import com.smartmart.dto.request.UpdateLocationRequest;
import com.smartmart.entity.Location;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.LocationRepository;
import com.smartmart.service.AuditLogService;
import com.smartmart.util.AuditData;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class LocationServiceImpl implements com.smartmart.service.LocationService {

    private final LocationRepository locationRepository;
    private final AuditLogService auditLogService;

    public LocationServiceImpl(LocationRepository locationRepository, AuditLogService auditLogService) {
        this.locationRepository = locationRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    @Override
    public List<LocationResponse> listAll(String q, String type, Boolean active) {
        String searchQuery = (q == null) ? "" : q;
        return locationRepository.findFiltered(searchQuery, type, active).stream().map(this::toResponse).toList();
    }

    @Override
    public LocationResponse create(CreateLocationRequest req) {
        Location parent = req.getParentId() != null
                ? locationRepository.findById(req.getParentId()).orElseThrow(() -> new NotFoundException("Không tìm thấy kho cha"))
                : null;
        Location location = Location.builder()
                .locationName(req.getLocationName())
                .locationType(req.getLocationType())
                .parent(parent)
                .active(true)
                .build();
        Location saved = locationRepository.save(location);

        auditLogService.log(
                AuditAction.LOCATION_CREATE,
                "LOCATION",
                saved.getId().toString(),
                "Tạo kho: " + saved.getLocationName(),
                null,
                locationData(saved)
        );

        return toResponse(saved);
    }

    @Override
    public LocationResponse update(Long id, UpdateLocationRequest req) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy vị trí kho"));
        String beforeData = locationData(location);
        Location parent = req.getParentId() != null
                ? locationRepository.findById(req.getParentId()).orElseThrow(() -> new NotFoundException("Không tìm thấy kho cha"))
                : null;

        location.setLocationName(req.getLocationName());
        location.setLocationType(req.getLocationType());
        location.setParent(parent);
        location.setActive(req.isActive());
        Location saved = locationRepository.save(location);

        auditLogService.log(
                AuditAction.LOCATION_UPDATE,
                "LOCATION",
                saved.getId().toString(),
                "Cập nhật kho: " + saved.getLocationName(),
                beforeData,
                locationData(saved)
        );

        return toResponse(saved);
    }

    private LocationResponse toResponse(Location l) {
        return LocationResponse.builder()
                .id(l.getId())
                .locationName(l.getLocationName())
                .locationType(l.getLocationType())
                .parentId(l.getParent() != null ? l.getParent().getId() : null)
                .active(l.isActive())
                .build();
    }
    private String locationData(Location location) {
        return AuditData.of(
                "locationName", location.getLocationName(),
                "locationType", location.getLocationType(),
                "parentId", location.getParent() != null
                        ? location.getParent().getId()
                        : null,
                "active", location.isActive()
        );
    }
}
