package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreateCategoryRequest;
import com.smartmart.dto.response.CategoryResponse;
import com.smartmart.entity.Category;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.AuditLogRepository;
import com.smartmart.repository.CategoryRepository;
import com.smartmart.service.AuditLogService;
import com.smartmart.util.AuditData;
import com.smartmart.util.ItemImageUrls;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CategoryServiceImpl implements com.smartmart.service.CategoryService {

    private final CategoryRepository categoryRepository;
    private final AuditLogService auditLogService;

    public CategoryServiceImpl(CategoryRepository categoryRepository, AuditLogService auditLogService) {
        this.categoryRepository = categoryRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listAll() {
        return categoryRepository.findAllByOrderByIdDesc().stream().map(this::toResponse).toList();
    }

    public CategoryResponse create(CreateCategoryRequest req) {
        Category parent = req.getParentId() != null
                ? categoryRepository.findById(req.getParentId()).orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục cha"))
                : null;
        Category category = Category.builder()
                .categoryName(req.getCategoryName())
                .parent(parent)
                .active(true)
                .imageUrl(ItemImageUrls.DEFAULT_CATEGORY)
                .build();
        Category saved = categoryRepository.save(category);
        auditLogService.log(
                AuditAction.CATEGORY_CREATE,
                "CATEGORY",
                saved.getId().toString(),
                "Tạo danh mục: " + saved.getCategoryName(),
                null,
                AuditData.of(
                        "categoryName", saved.getCategoryName(),
                        "parentId", saved.getParent() != null
                                ? saved.getParent().getId()
                                : null,
                        "active", saved.isActive()
                )
        );
        return toResponse(saved);
    }

    private CategoryResponse toResponse(Category c) {
        return CategoryResponse.builder()
                .id(c.getId())
                .categoryName(c.getCategoryName())
                .parentId(c.getParent() != null ? c.getParent().getId() : null)
                .active(c.isActive())
                .imageUrl(ItemImageUrls.resolveCategory(c))
                .build();
    }
}
