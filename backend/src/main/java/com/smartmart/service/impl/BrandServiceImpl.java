package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateBrandRequest;
import com.smartmart.dto.request.UpdateBrandRequest;
import com.smartmart.dto.response.BrandResponse;
import com.smartmart.entity.Brand;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.BrandRepository;
import com.smartmart.service.BrandService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;

    public BrandServiceImpl(BrandRepository brandRepository) {
        this.brandRepository = brandRepository;
    }

    @Override
    public BrandResponse create(CreateBrandRequest request) {
        if (brandRepository.existsByBrandNameIgnoreCase(request.getBrandName().trim())) {
            throw new BadRequestException("Thương hiệu đã tồn tại");
        }
        Brand brand = Brand.builder()
                .brandName(request.getBrandName().trim())
                .description(blankToNull(request.getDescription()))
                .active(true)
                .build();
        return toResponse(brandRepository.save(brand));
    }

    @Override
    public BrandResponse update(Long id, UpdateBrandRequest request) {
        Brand brand = findById(id);
        if (request.getBrandName() != null && !request.getBrandName().isBlank()) {
            String newName = request.getBrandName().trim();
            if (!newName.equalsIgnoreCase(brand.getBrandName())
                    && brandRepository.existsByBrandNameIgnoreCase(newName)) {
                throw new BadRequestException("Thương hiệu đã tồn tại");
            }
            brand.setBrandName(newName);
        }
        if (request.getDescription() != null) {
            brand.setDescription(blankToNull(request.getDescription()));
        }
        if (request.getActive() != null) {
            brand.setActive(request.getActive());
        }
        return toResponse(brandRepository.save(brand));
    }

    @Override
    @Transactional(readOnly = true)
    public BrandResponse getById(Long id) {
        return toResponse(findById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BrandResponse> listAll() {
        return brandRepository.findByActiveTrueOrderByBrandNameAsc().stream()
                .map(this::toResponse).toList();
    }

    private Brand findById(Long id) {
        return brandRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thương hiệu: " + id));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private BrandResponse toResponse(Brand brand) {
        return BrandResponse.builder()
                .id(brand.getId())
                .brandName(brand.getBrandName())
                .description(brand.getDescription())
                .active(brand.isActive())
                .createdAt(brand.getCreatedAt())
                .build();
    }
}
