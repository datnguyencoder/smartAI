package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateFinanceCategoryRequest;
import com.smartmart.dto.request.UpdateFinanceCategoryRequest;
import com.smartmart.dto.response.FinanceCategoryResponse;
import com.smartmart.entity.FinanceCategory;
import com.smartmart.enums.FinanceTransactionType;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.FinanceCategoryRepository;
import com.smartmart.service.FinanceCategoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class FinanceCategoryServiceImpl implements FinanceCategoryService {

    private final FinanceCategoryRepository financeCategoryRepository;

    public FinanceCategoryServiceImpl(FinanceCategoryRepository financeCategoryRepository) {
        this.financeCategoryRepository = financeCategoryRepository;
    }

    @Override
    public FinanceCategoryResponse create(CreateFinanceCategoryRequest request) {
        FinanceCategory category = FinanceCategory.builder()
                .name(request.getName().trim())
                .type(request.getType())
                .active(true)
                .build();
        return toResponse(financeCategoryRepository.save(category));
    }

    @Override
    public FinanceCategoryResponse update(Long id, UpdateFinanceCategoryRequest request) {
        FinanceCategory category = findById(id);
        if (request.getName() != null && !request.getName().isBlank()) {
            category.setName(request.getName().trim());
        }
        if (request.getActive() != null) {
            category.setActive(request.getActive());
        }
        return toResponse(financeCategoryRepository.save(category));
    }

    @Override
    @Transactional(readOnly = true)
    public FinanceCategoryResponse getById(Long id) {
        return toResponse(findById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FinanceCategoryResponse> list(FinanceTransactionType type) {
        List<FinanceCategory> categories = type == null
                ? financeCategoryRepository.findByActiveTrueOrderByNameAsc()
                : financeCategoryRepository.findByTypeAndActiveTrueOrderByNameAsc(type);
        return categories.stream().map(this::toResponse).toList();
    }

    private FinanceCategory findById(Long id) {
        return financeCategoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục thu chi: " + id));
    }

    private FinanceCategoryResponse toResponse(FinanceCategory category) {
        return FinanceCategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType())
                .active(category.isActive())
                .createdAt(category.getCreatedAt())
                .build();
    }
}
