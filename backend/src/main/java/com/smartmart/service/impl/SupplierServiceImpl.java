package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreateSupplierRequest;
import com.smartmart.dto.response.SupplierResponse;
import com.smartmart.entity.Supplier;
import com.smartmart.repository.SupplierRepository;
import com.smartmart.service.AuditLogService;
import com.smartmart.util.AuditData;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SupplierServiceImpl implements com.smartmart.service.SupplierService {

    private final SupplierRepository supplierRepository;
    private final AuditLogService auditLogService;

    public SupplierServiceImpl(SupplierRepository supplierRepository, AuditLogService auditLogService) {
        this.supplierRepository = supplierRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    @Override
    public List<SupplierResponse> listAll(String q, Boolean active) {
        String searchQuery = (q == null) ? "" : q;
        return supplierRepository.findFiltered(searchQuery, active).stream().map(this::toResponse).toList();
    }

    @Override
    public SupplierResponse create(CreateSupplierRequest req) {
        Supplier supplier = Supplier.builder()
                .supplierName(req.getSupplierName())
                .contactPerson(req.getContactPerson())
                .phone(req.getPhone())
                .email(req.getEmail())
                .address(req.getAddress())
                .active(true)
                .build();
        Supplier saved = supplierRepository.save(supplier);

        auditLogService.log(
                AuditAction.SUPPLIER_CREATE,
                "SUPPLIER",
                saved.getId().toString(),
                "Tạo nhà cung cấp: " + saved.getSupplierName(),
                null,
                supplierData(saved)
        );

        return toResponse(saved);
    }

    @Override
    public SupplierResponse update(Long id, com.smartmart.dto.request.UpdateSupplierRequest req) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new com.smartmart.exception.NotFoundException("Không tìm thấy nhà cung cấp"));
        String beforeData = supplierData(supplier);
        supplier.setSupplierName(req.getSupplierName());
        supplier.setContactPerson(req.getContactPerson());
        supplier.setPhone(req.getPhone());
        supplier.setEmail(req.getEmail());
        supplier.setAddress(req.getAddress());
        supplier.setActive(req.isActive());
        Supplier saved = supplierRepository.save(supplier);

        auditLogService.log(
                AuditAction.SUPPLIER_UPDATE,
                "SUPPLIER",
                saved.getId().toString(),
                "Cập nhật nhà cung cấp: " + saved.getSupplierName(),
                beforeData,
                supplierData(saved)
        );

        return toResponse(saved);
    }

    private SupplierResponse toResponse(Supplier s) {
        return SupplierResponse.builder()
                .id(s.getId())
                .supplierName(s.getSupplierName())
                .contactPerson(s.getContactPerson())
                .phone(s.getPhone())
                .email(s.getEmail())
                .address(s.getAddress())
                .active(s.isActive())
                .build();
    }
    private String supplierData(Supplier supplier) {
        return AuditData.of(
                "supplierName", supplier.getSupplierName(),
                "contactPerson", supplier.getContactPerson(),
                "phone", supplier.getPhone(),
                "email", supplier.getEmail(),
                "address", supplier.getAddress(),
                "active", supplier.isActive()
        );
    }
}
