package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateCategoryRequest;
import com.smartmart.dto.response.CategoryResponse;
import com.smartmart.entity.Category;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.CategoryRepository;
import com.smartmart.util.ItemImageUrls;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CategoryServiceImpl implements com.smartmart.service.CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
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
        return toResponse(categoryRepository.save(category));
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
