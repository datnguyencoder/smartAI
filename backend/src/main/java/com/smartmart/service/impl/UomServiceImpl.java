package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateUomRequest;
import com.smartmart.dto.response.UomResponse;
import com.smartmart.entity.Uom;
import com.smartmart.repository.UomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UomServiceImpl implements com.smartmart.service.UomService {

    private final UomRepository uomRepository;

    public UomServiceImpl(UomRepository uomRepository) {
        this.uomRepository = uomRepository;
    }

    @Transactional(readOnly = true)
    @Override
    public List<UomResponse> listAll() {
        return uomRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public UomResponse create(CreateUomRequest req) {
        Uom uom = Uom.builder()
                .uomName(req.getUomName())
                .category(req.getCategory())
                .conversionRatio(req.getConversionRatio())
                .baseUnit(req.isBaseUnit())
                .build();
        return toResponse(uomRepository.save(uom));
    }

    private UomResponse toResponse(Uom u) {
        return UomResponse.builder()
                .id(u.getId())
                .uomName(u.getUomName())
                .category(u.getCategory())
                .conversionRatio(u.getConversionRatio())
                .baseUnit(u.isBaseUnit())
                .build();
    }
}
