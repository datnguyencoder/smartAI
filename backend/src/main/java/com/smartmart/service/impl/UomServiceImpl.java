package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreateUomRequest;
import com.smartmart.dto.request.UpdateUomRequest;
import com.smartmart.dto.response.UomResponse;
import com.smartmart.entity.Uom;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.UomRepository;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.UomService;
import com.smartmart.util.AuditData;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

@Service
@Transactional
public class UomServiceImpl implements UomService {

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
    public UomResponse create(CreateUomRequest request) {
        String uomName = normalizeName(request.getUomName());
        String category = normalizeCategory(request.getCategory());

        if (uomRepository.existsByUomNameIgnoreCase(uomName)) {
            throw new BadRequestException("Tên đơn vị tính đã tồn tại");
        }

        Uom uom = Uom.builder()
                .uomName(uomName)
                .category(category)
                .conversionRatio(resolveConversionRatio(request.getConversionRatio()))
                .active(true)
                .build();
        if(request.getConversionUomId() != null){
            uom.setConversionUom(findById(request.getConversionUomId()));
        }
        Uom saved = uomRepository.save(uom);

        if (saved.getConversionUom() == null) {
            saved.setConversionUom(saved);
            saved = uomRepository.save(saved);
        }

        auditLogService.log(
                AuditAction.UOM_CREATE,
                "UOM",
                saved.getId().toString(),
                "Tạo đơn vị tính: " + saved.getUomName(),
                null,
                uomData(saved)
        );

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UomResponse> list(String category) {
        if (category == null || category.isBlank()) {
            return uomRepository.findAllByOrderByIdDesc()
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        return uomRepository.findByCategoryIgnoreCaseAndActiveTrueOrderByIdDesc(category.trim())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<String> listGroups() {
        return uomRepository.findDistinctCategories();
    }

    @Override
    public UomResponse update(Long id, UpdateUomRequest request) {
        Uom uom = findById(id);

        String beforeData = uomData(uom);

        String uomName = normalizeName(request.getUomName());
        String category = normalizeCategory(request.getCategory());

        if (uomRepository.existsByUomNameIgnoreCaseAndIdNot(uomName, id)) {
            throw new BadRequestException("Tên đơn vị tính đã tồn tại");
        }

        uom.setUomName(uomName);
        uom.setCategory(category);
        uom.setConversionRatio(resolveConversionRatio(request.getConversionRatio()));

        if (request.getActive() != null) {
            uom.setActive(request.getActive());
        }
        if (request.getConversionUomId() != null) {
            uom.setConversionUom(findById(request.getConversionUomId()));
        }

        Uom saved = uomRepository.save(uom);

        auditLogService.log(
                AuditAction.UOM_UPDATE,
                "UOM",
                saved.getId().toString(),
                "Cập nhật đơn vị tính: " + saved.getUomName(),
                beforeData,
                uomData(saved)
        );

        return toResponse(saved);
    }

    @Override
    public void activate(Long id) {
        Uom uom = findById(id);

        if (uom.isActive()) {
            return;
        }

        String beforeData = uomData(uom);

        uom.setActive(true);
        Uom saved = uomRepository.save(uom);

        auditLogService.log(
                AuditAction.UOM_ACTIVATE,
                "UOM",
                saved.getId().toString(),
                "Kích hoạt đơn vị tính: " + saved.getUomName(),
                beforeData,
                uomData(saved)
        );
    }

    @Override
    public void deactivate(Long id) {
        Uom uom = findById(id);

        if (!uom.isActive()) {
            return;
        }

        String beforeData = uomData(uom);

        uom.setActive(false);
        Uom saved = uomRepository.save(uom);

        auditLogService.log(
                AuditAction.UOM_DEACTIVATE,
                "UOM",
                saved.getId().toString(),
                "Ngưng hoạt động đơn vị tính: " + saved.getUomName(),
                beforeData,
                uomData(saved)
        );
    }

    private Uom findById(Long id) {
        return uomRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn vị tính"));
    }

    private String normalizeName(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeCategory(String value) {
        return value == null ? null : value.trim();
    }

    private BigDecimal resolveConversionRatio(BigDecimal value) {
        return value == null ? BigDecimal.ONE : value;
    }

    private String uomData(Uom uom) {
        return AuditData.of(
                "uomName", uom.getUomName(),
                "category", uom.getCategory(),
                "conversionRatio", uom.getConversionRatio(),
                "active", uom.isActive(),
                "conversionUomId", uom.getConversionUom() != null ? uom.getConversionUom().getId() : null,
                "conversionUomName", uom.getConversionUom() != null ? uom.getConversionUom().getUomName() : null
        );
    }

    private UomResponse toResponse(Uom u) {
        Uom conversionUom = u.getConversionUom();

        return UomResponse.builder()
                .id(u.getId())
                .uomName(u.getUomName())
                .category(u.getCategory())
                .conversionRatio(u.getConversionRatio())
                .conversionUomId(conversionUom != null ? conversionUom.getId() : null)
                .conversionUomName(conversionUom != null ? conversionUom.getUomName() : null)
                .active(u.isActive())
                .build();
    }
}
