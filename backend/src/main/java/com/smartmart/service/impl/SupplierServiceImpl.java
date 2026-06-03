package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateSupplierRequest;
import com.smartmart.dto.response.SupplierResponse;
import com.smartmart.entity.Supplier;
import com.smartmart.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SupplierServiceImpl implements com.smartmart.service.SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierServiceImpl(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @Transactional(readOnly = true)
    @Override
    public List<SupplierResponse> listAll() {
        return supplierRepository.findAll().stream().map(this::toResponse).toList();
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
        return toResponse(supplierRepository.save(supplier));
    }

    private SupplierResponse toResponse(Supplier s) {
        return SupplierResponse.builder()
                .id(s.getId())
                .supplierName(s.getSupplierName())
                .contactPerson(s.getContactPerson())
                .phone(s.getPhone())
                .email(s.getEmail())
                .active(s.isActive())
                .build();
    }
}
