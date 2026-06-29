package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreateCategoryRequest;
import com.smartmart.dto.request.UpdateCategoryRequest;
import com.smartmart.dto.response.CategoryResponse;
import com.smartmart.entity.Category;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.ConflictException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.CategoryRepository;
import com.smartmart.repository.ItemRepository;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.CategoryService;
import com.smartmart.util.AuditData;
import com.smartmart.util.ItemImageUrls;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;
    private final AuditLogService auditLogService;

    public CategoryServiceImpl(
            CategoryRepository categoryRepository,
            ItemRepository itemRepository,
            AuditLogService auditLogService) {
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> listAll() {
        return categoryRepository.findAllByOrderByIdDesc().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getById(Long id) {
        return toResponse(findCategory(id));
    }

    @Override
    public CategoryResponse create(CreateCategoryRequest req) {
        String name = normalizeName(req.getCategoryName());
        if (categoryRepository.existsByCategoryNameIgnoreCase(name)) {
            throw new ConflictException("Tên danh mục đã tồn tại: " + name);
        }
        Category parent = req.getParentId() != null
                ? categoryRepository.findById(req.getParentId())
                        .orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục cha"))
                : null;
        Category category = Category.builder()
                .categoryName(name)
                .parent(parent)
                .active(true)
                .imageUrl(ItemImageUrls.DEFAULT_CATEGORY)
                .uomCategories(normalizeUomCategories(req.getUomCategories()))
                .build();
        Category saved = categoryRepository.save(category);
        auditLogService.log(
                AuditAction.CATEGORY_CREATE,
                "CATEGORY",
                saved.getId().toString(),
                "Tạo danh mục: " + saved.getCategoryName(),
                null,
                categoryData(saved));
        return toResponse(saved);
    }

    @Override
    public CategoryResponse update(Long id, UpdateCategoryRequest req) {
        Category category = findCategory(id);
        String beforeData = categoryData(category);
        String name = normalizeName(req.getCategoryName());
        if (categoryRepository.existsByCategoryNameIgnoreCaseAndIdNot(name, id)) {
            throw new ConflictException("Tên danh mục đã tồn tại: " + name);
        }
        category.setCategoryName(name);
        if (req.getParentId() != null) {
            if (req.getParentId().equals(id)) {
                throw new BadRequestException("Danh mục không thể là cha của chính nó");
            }
            Category parent = categoryRepository.findById(req.getParentId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục cha"));
            category.setParent(parent);
        }
        if (req.getActive() != null) {
            category.setActive(req.getActive());
        }
        if (req.getUomCategories() != null) {
            category.setUomCategories(normalizeUomCategories(req.getUomCategories()));
        }
        Category saved = categoryRepository.save(category);
        auditLogService.log(
                AuditAction.CATEGORY_UPDATE,
                "CATEGORY",
                saved.getId().toString(),
                "Cập nhật danh mục: " + saved.getCategoryName(),
                beforeData,
                categoryData(saved));
        return toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        Category category = findCategory(id);
        if (itemRepository.existsByCategoryIdAndActiveTrue(id)) {
            throw new BadRequestException(
                    "Không thể xóa danh mục đang có sản phẩm đang kinh doanh. Hãy chuyển sản phẩm hoặc ngừng kinh doanh trước.");
        }
        String beforeData = categoryData(category);
        category.setActive(false);
        categoryRepository.save(category);
        auditLogService.log(
                AuditAction.CATEGORY_DELETE,
                "CATEGORY",
                category.getId().toString(),
                "Xóa mềm danh mục: " + category.getCategoryName(),
                beforeData,
                categoryData(category));
    }

    private Category findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục"));
    }

    private static String normalizeName(String name) {
        if (name == null || name.isBlank()) {
            throw new BadRequestException("Tên danh mục không được để trống");
        }
        return name.trim().replaceAll("\\s+", " ");
    }

    private CategoryResponse toResponse(Category c) {
        return CategoryResponse.builder()
                .id(c.getId())
                .categoryName(c.getCategoryName())
                .parentId(c.getParent() != null ? c.getParent().getId() : null)
                .active(c.isActive())
                .imageUrl(ItemImageUrls.resolveCategory(c))
                .uomCategories(c.getUomCategories())
                .build();
    }

    private String categoryData(Category c) {
        return AuditData.of(
                "categoryName", c.getCategoryName(),
                "parentId", c.getParent() != null ? c.getParent().getId() : null,
                "active", c.isActive(),
                "uomCategories", c.getUomCategories());
    }
    private static String normalizeUomCategories(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(String::toUpperCase)
                .distinct()
                .collect(Collectors.joining(","));
    }
}
