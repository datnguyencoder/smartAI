package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreateCategoryRequest;
import com.smartmart.dto.request.MoveCategoryItemsRequest;
import com.smartmart.dto.request.UpdateCategoryRequest;
import com.smartmart.dto.response.CategoryResponse;
import com.smartmart.entity.Category;
import com.smartmart.entity.Item;
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
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
        boolean wasActive = category.isActive();
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
        if (wasActive != saved.isActive()) {
            auditLogService.log(
                    saved.isActive() ? AuditAction.CATEGORY_ACTIVATE : AuditAction.CATEGORY_DEACTIVATE,
                    "CATEGORY",
                    saved.getId().toString(),
                    (saved.isActive() ? "Mở lại danh mục: " : "Ngưng danh mục: ") + saved.getCategoryName(),
                    beforeData,
                    categoryData(saved));
        }
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

    @Override
    public int moveItems(Long sourceCategoryId, MoveCategoryItemsRequest req) {
        if (req == null) {
            throw new BadRequestException("Dữ liệu chuyển sản phẩm không hợp lệ");
        }
        Category source = findCategory(sourceCategoryId);
        String beforeData = categoryData(source);
        List<Item> sourceItems = itemRepository.findByCategoryIdAndActiveTrue(sourceCategoryId);
        boolean deleteSourceAfterMove = Boolean.TRUE.equals(req.getDeleteSourceAfterMove());

        if (sourceItems.isEmpty()) {
            if (deleteSourceAfterMove) {
                source.setActive(false);
                categoryRepository.save(source);
            }
            auditMove(source, beforeData, 0, deleteSourceAfterMove);
            return 0;
        }

        int movedCount = hasCustomMoves(req)
                ? moveCustom(source, sourceItems, req, deleteSourceAfterMove)
                : moveAll(source, sourceItems, req);

        if (deleteSourceAfterMove) {
            source.setActive(false);
            categoryRepository.save(source);
        }

        auditMove(source, beforeData, movedCount, deleteSourceAfterMove);
        return movedCount;
    }

    private Category findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục"));
    }

    private int moveAll(Category source, List<Item> sourceItems, MoveCategoryItemsRequest req) {
        Category target = resolveMoveTarget(source, req.getTargetCategoryId());
        sourceItems.forEach(item -> item.setCategory(target));
        itemRepository.saveAll(sourceItems);
        return sourceItems.size();
    }

    private int moveCustom(
            Category source,
            List<Item> sourceItems,
            MoveCategoryItemsRequest req,
            boolean deleteSourceAfterMove) {
        Map<Long, Item> sourceItemMap = sourceItems.stream()
                .collect(Collectors.toMap(Item::getId, item -> item));
        Set<Long> movedItemIds = new HashSet<>();
        Map<Long, Category> targetCache = new HashMap<>();

        for (MoveCategoryItemsRequest.ItemMove move : req.getMoves()) {
            Long itemId = move.getItemId();
            if (!movedItemIds.add(itemId)) {
                throw new BadRequestException("Sản phẩm bị lặp trong danh sách chuyển: " + itemId);
            }
            Item item = sourceItemMap.get(itemId);
            if (item == null) {
                throw new BadRequestException("Sản phẩm không thuộc danh mục nguồn hoặc đã ngừng kinh doanh: " + itemId);
            }
            Category target = targetCache.computeIfAbsent(
                    move.getTargetCategoryId(),
                    targetId -> resolveMoveTarget(source, targetId));
            item.setCategory(target);
        }

        if (deleteSourceAfterMove && movedItemIds.size() != sourceItems.size()) {
            throw new BadRequestException("Vui lòng chọn danh mục chuyển tới cho tất cả sản phẩm trước khi ngưng danh mục.");
        }

        List<Item> movedItems = sourceItems.stream()
                .filter(item -> movedItemIds.contains(item.getId()))
                .toList();
        itemRepository.saveAll(movedItems);
        return movedItems.size();
    }

    private Category resolveMoveTarget(Category source, Long targetCategoryId) {
        if (targetCategoryId == null) {
            throw new BadRequestException("Vui lòng chọn danh mục đích");
        }
        if (source.getId().equals(targetCategoryId)) {
            throw new BadRequestException("Danh mục đích phải khác danh mục hiện tại");
        }
        Category target = findCategory(targetCategoryId);
        if (!target.isActive()) {
            throw new BadRequestException("Không thể chuyển sản phẩm sang danh mục đã ngưng hoạt động");
        }
        return target;
    }

    private boolean hasCustomMoves(MoveCategoryItemsRequest req) {
        return req.getMoves() != null && !req.getMoves().isEmpty();
    }

    private void auditMove(Category source, String beforeData, int movedCount, boolean deleteSourceAfterMove) {
        auditLogService.log(
                AuditAction.CATEGORY_MOVE_ITEMS,
                "CATEGORY",
                source.getId().toString(),
                "Chuyển " + movedCount + " sản phẩm khỏi danh mục: " + source.getCategoryName(),
                beforeData,
                AuditData.of(
                        "categoryName", source.getCategoryName(),
                        "active", source.isActive(),
                        "movedItems", movedCount,
                        "deleteSourceAfterMove", deleteSourceAfterMove));
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
