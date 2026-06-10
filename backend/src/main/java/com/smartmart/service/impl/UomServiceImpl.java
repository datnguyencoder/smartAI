package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreateUomRequest;
import com.smartmart.dto.response.UomResponse;
import com.smartmart.entity.Uom;
import com.smartmart.repository.UomRepository;
import com.smartmart.service.AuditLogService;
import com.smartmart.util.AuditData;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UomServiceImpl implements com.smartmart.service.UomService {

    private final UomRepository uomRepository;
    private final AuditLogService auditLogService;

    public UomServiceImpl(UomRepository uomRepository, AuditLogService auditLogService) {
        this.uomRepository = uomRepository;
        this.auditLogService = auditLogService ;
    }

    @Transactional(readOnly = true)
    @Override
    public List<UomResponse> listAll() {
        return uomRepository.findAllByOrderByIdDesc().stream().map(this::toResponse).toList();
    }

    @Override
    public UomResponse create(CreateUomRequest req) {
        Uom uom = Uom.builder()
                .uomName(req.getUomName())
                .category(req.getCategory())
                .conversionRatio(req.getConversionRatio())
                .baseUnit(req.isBaseUnit())
                .build();
        Uom saved = uomRepository.save(uom);

        auditLogService.log(
                AuditAction.UOM_CREATE,
                "UOM",
                saved.getId().toString(),
                "Tạo đơn vị tính: " + saved.getUomName(),
                null,
                AuditData.of(
                        "uomName", saved.getUomName(),
                        "category", saved.getCategory(),
                        "conversionRatio", saved.getConversionRatio(),
                        "baseUnit", saved.isBaseUnit()
                )
        );

        return toResponse(saved);
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
