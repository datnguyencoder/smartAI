package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateLocationRequest;
import com.smartmart.dto.response.LocationResponse;
import com.smartmart.entity.Location;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.LocationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class LocationServiceImpl implements com.smartmart.service.LocationService {

    private final LocationRepository locationRepository;

    public LocationServiceImpl(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
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
        return toResponse(locationRepository.save(location));
    }

    @Override
    public LocationResponse update(Long id, com.smartmart.dto.request.UpdateLocationRequest req) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy vị trí kho"));
        
        Location parent = req.getParentId() != null
                ? locationRepository.findById(req.getParentId()).orElseThrow(() -> new NotFoundException("Không tìm thấy kho cha"))
                : null;

        location.setLocationName(req.getLocationName());
        location.setLocationType(req.getLocationType());
        location.setParent(parent);
        location.setActive(req.isActive());
        return toResponse(locationRepository.save(location));
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
}
