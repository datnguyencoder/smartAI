package com.smartmart.service.impl;

import com.smartmart.common.response.PageResponse;
import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreateItemRequest;
import com.smartmart.dto.request.UpdateItemRequest;
import com.smartmart.dto.response.ItemResponse;
import com.smartmart.dto.response.UomResponse;
import com.smartmart.entity.Item;
import com.smartmart.entity.Uom;
import com.smartmart.entity.Category;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.ConflictException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.*;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.ItemService;
import com.smartmart.util.AuditData;
import com.smartmart.util.ItemImageUrls;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@Transactional
public class ItemServiceImpl implements ItemService {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final UomRepository uomRepository;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final OrderItemRepository orderItemRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final AuditLogService auditLogService;
    private final SupplierItemRepository supplierItemRepository;

    public ItemServiceImpl(
            ItemRepository itemRepository,
            CategoryRepository categoryRepository,
            UomRepository uomRepository,
            CurrentInventoryRepository currentInventoryRepository,
            OrderItemRepository orderItemRepository,
            PurchaseOrderItemRepository purchaseOrderItemRepository,
            AuditLogService auditLogService,
            SupplierItemRepository supplierItemRepository) {
        this.itemRepository = itemRepository;
        this.categoryRepository = categoryRepository;
        this.uomRepository = uomRepository;
        this.currentInventoryRepository = currentInventoryRepository;
        this.orderItemRepository = orderItemRepository;
        this.purchaseOrderItemRepository = purchaseOrderItemRepository;
        this.auditLogService = auditLogService;
        this.supplierItemRepository = supplierItemRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItemResponse> listAll(String search, Long categoryId, Boolean active) {
        String q = (search == null || search.isBlank()) ? "" : search.trim();
        List<Item> items = itemRepository.searchFiltered(q, categoryId, active);
        return mapToResponses(items);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ItemResponse> listPaged(String search, Long categoryId, Boolean active, Pageable pageable) {
        String q = (search == null || search.isBlank()) ? "" : search.trim();
        Page<Item> page = itemRepository.searchFilteredPaged(q, categoryId, active, pageable);
        List<ItemResponse> content = mapToResponses(page.getContent());
        return PageResponse.<ItemResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ItemResponse getById(Long id) {
        return toResponse(findItem(id), soldQtyMap().getOrDefault(id, BigDecimal.ZERO));
    }

    @Override
    @Transactional(readOnly = true)
    public ItemResponse getByBarcode(String code) {
        Item item = itemRepository.findActiveByItemCode(normalizeItemCode(code))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm với mã: " + code));
        BigDecimal sold = soldQtyMap().getOrDefault(item.getId(), BigDecimal.ZERO);
        return toResponse(item, sold);
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.smartmart.dto.response.UomResponse> getItemUoms(Long id) {
        Item item = findItem(id);
        List<UomResponse> uoms = new ArrayList<>();
        if (item.getBaseUom() != null) {
            uoms.add(toUomResponse(item.getBaseUom()));
        }
        if (item.getPurchaseUom() != null && !item.getPurchaseUom().getId().equals(item.getBaseUom().getId())) {
            uoms.add(toUomResponse(item.getPurchaseUom()));
        }
        return uoms;
    }

    private UomResponse toUomResponse(Uom uom) {
        return UomResponse.builder()
                .id(uom.getId())
                .uomName(uom.getUomName())
                .category(uom.getCategory())
                .conversionRatio(uom.getConversionRatio())
                .build();
    }

    @Override
    @CacheEvict(value = { "items", "itemsPage", "purchaseOrders" }, allEntries = true)
    public ItemResponse create(CreateItemRequest req) {
        String itemCode = normalizeItemCode(req.getItemCode());
        String itemName = normalizeItemName(req.getItemName());
        Category category = req.getCategoryId() != null
                ? resolveActiveCategory(req.getCategoryId())
                : null;
        if (itemRepository.existsByItemCodeIgnoreCase(itemCode)) {
            throw new ConflictException("Mã SKU đã tồn tại: " + itemCode
                    + ". Mỗi biến thể phải tạo SKU riêng, ví dụ MI-HAOHAO-TOM và MI-HAOHAO-CHUA-CAY.");
        }
        if (req.getSellingPrice().compareTo(req.getCostPrice()) < 0) {
            throw new BadRequestException("Giá bán phải >= giá nhập");
        }
        Uom baseUom = uomRepository.findById(req.getBaseUomId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn vị tính"));
        Uom purchaseUom = req.getPurchaseUomId() != null
                ? uomRepository.findById(req.getPurchaseUomId())
                        .orElseThrow(() -> new NotFoundException("Không tìm thấy UOM nhập"))
                : baseUom;
        validateUomMatchesCategory(baseUom, category);
        validateUomMatchesCategory(purchaseUom, category);

        BigDecimal purchaseConversionRatio = purchaseUom.getConversionRatio();

        String imageUrl = resolveImageUrlForCreate(req.getImageUrl(), itemCode);

        Item item = Item.builder()
                .itemCode(itemCode)
                .itemName(itemName)
                .itemType(req.getItemType())
                .category(req.getCategoryId() != null
                        ? resolveActiveCategory(req.getCategoryId())
                        : null)
                .baseUom(baseUom)
                .purchaseUom(purchaseUom)
                .costPrice(req.getCostPrice())
                .sellingPrice(req.getSellingPrice())
                .minimumStock(req.getMinimumStock() != null ? req.getMinimumStock() : 0)
                .hasExpiry(req.isHasExpiry())
                .active(true)
                .imageUrl(imageUrl)
                .purchaseConversionRatio(purchaseConversionRatio)
                .build();
        Item saved = itemRepository.save(item);
        auditLogService.log(
                AuditAction.ITEM_CREATE,
                "ITEM",
                saved.getId().toString(),
                "Tạo sản phẩm: " + saved.getItemCode(),
                null,
                itemData(saved));
        return toResponse(saved, BigDecimal.ZERO);
    }

    @Override
    @CacheEvict(value = { "items", "itemsPage", "purchaseOrders" }, allEntries = true)
    public ItemResponse update(Long id, UpdateItemRequest req) {
        Item item = findItem(id);
        String beforeData = itemData(item);
        if (req.getItemCode() != null && !req.getItemCode().isBlank()) {
            String newItemCode = normalizeItemCode(req.getItemCode());
            if (!newItemCode.equalsIgnoreCase(item.getItemCode())) {
                checkItemUsageForSkuChange(id);
                if (itemRepository.existsByItemCodeIgnoreCase(newItemCode)) {
                    throw new ConflictException("Mã SKU đã tồn tại: " + newItemCode
                            + ". Hãy dùng mã khác cho biến thể sản phẩm này.");
                }
                item.setItemCode(newItemCode);
                if (item.getImageUrl() == null || item.getImageUrl().isBlank()
                        || item.getImageUrl().startsWith("/media/items/")) {
                    item.setImageUrl(ItemImageUrls.defaultItemPath(newItemCode));
                }
            }
        }
        if (req.getItemName() != null && !req.getItemName().isBlank()) {
            item.setItemName(normalizeItemName(req.getItemName()));
        }
        if (req.getItemType() != null) {
            item.setItemType(req.getItemType());
        }
        if (req.getCategoryId() != null) {
            item.setCategory(resolveActiveCategory(req.getCategoryId()));
        }
        if (req.getBaseUomId() != null && !req.getBaseUomId().equals(item.getBaseUom().getId())) {
            checkItemUsageForUomChange(id);
            item.setBaseUom(uomRepository.findById(req.getBaseUomId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn vị tính")));
        }
        if (req.getPurchaseUomId() != null) {
            Long currentPurchaseUomId = item.getPurchaseUom() != null ? item.getPurchaseUom().getId() : null;
            if (!req.getPurchaseUomId().equals(currentPurchaseUomId)) {
                checkItemUsageForUomChange(id);
                Uom purchaseUom = uomRepository.findById(req.getPurchaseUomId())
                        .orElseThrow(() -> new NotFoundException("Không tìm thấy UOM nhập"));
                item.setPurchaseUom(purchaseUom);
                item.setPurchaseConversionRatio(purchaseUom.getConversionRatio());
            }

        }
        if (req.getCostPrice() != null) {
            item.setCostPrice(req.getCostPrice());
        }
        if (req.getSellingPrice() != null) {
            if (req.getSellingPrice().compareTo(item.getCostPrice()) < 0) {
                throw new BadRequestException("Giá bán phải >= giá nhập");
            }
            item.setSellingPrice(req.getSellingPrice());
        }
        if (req.getMinimumStock() != null) {
            item.setMinimumStock(req.getMinimumStock());
        }
        if (req.getHasExpiry() != null) {
            item.setHasExpiry(req.getHasExpiry());
        }
        if (req.getActive() != null) {
            item.setActive(req.getActive());
        }
        if (req.getImageUrl() != null) {
            item.setImageUrl(req.getImageUrl().isBlank()
                    ? ItemImageUrls.defaultItemPath(item.getItemCode())
                    : req.getImageUrl().trim());
        }
        BigDecimal sold = soldQtyMap().getOrDefault(id, BigDecimal.ZERO);
        validateUomMatchesCategory(item.getBaseUom(), item.getCategory());
        validateUomMatchesCategory(item.getPurchaseUom(), item.getCategory());
        Item saved = itemRepository.save(item);
        auditLogService.log(
                AuditAction.ITEM_UPDATE,
                "ITEM",
                saved.getId().toString(),
                "Cập nhật sản phẩm: " + saved.getItemCode()
                        + " - " + saved.getItemName(),
                beforeData,
                itemData(saved));
        return toResponse(saved, sold);
    }

    private Category resolveActiveCategory(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục"));
        if (!category.isActive()) {
            throw new BadRequestException("Không thể gán danh mục đã ngừng hoạt động cho sản phẩm");
        }
        return category;
    }

    @Override
    public Item findItem(Long id) {
        return itemRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm"));
    }

    private void checkItemUsageForUomChange(Long itemId) {
        boolean hasInventory = !currentInventoryRepository.findByItemId(itemId).isEmpty();
        boolean hasPurchaseHistory = purchaseOrderItemRepository.existsByItemId(itemId);
        boolean hasSalesHistory = orderItemRepository.existsByItemId(itemId);

        if (hasInventory || hasPurchaseHistory || soldQtyMap().containsKey(itemId)) {
            throw new BadRequestException(
                    "Không thể thay đổi Đơn vị tính vì sản phẩm này đã phát sinh giao dịch nhập kho, tồn kho hoặc xuất bán. Vui lòng tạo Mã Sản Phẩm mới.");
        }
    }

    private void checkItemUsageForSkuChange(Long itemId) {
        boolean hasInventory = !currentInventoryRepository.findByItemId(itemId).isEmpty();
        boolean hasPurchaseHistory = purchaseOrderItemRepository.existsByItemId(itemId);
        boolean hasSalesHistory = soldQtyMap().containsKey(itemId);
        if (hasInventory || hasPurchaseHistory || hasSalesHistory) {
            throw new BadRequestException(
                    "Không thể đổi mã SKU vì sản phẩm đã có tồn kho hoặc lịch sử giao dịch. Vui lòng tạo SKU mới cho biến thể mới.");
        }
    }

    private List<ItemResponse> mapToResponses(List<Item> items) {
        Map<Long, BigDecimal> soldMap = soldQtyMap();
        return items.stream()
                .map(item -> toResponse(item, soldMap.getOrDefault(item.getId(), BigDecimal.ZERO)))
                .toList();
    }

    private Map<Long, BigDecimal> soldQtyMap() {
        Map<Long, BigDecimal> map = new HashMap<>();
        for (Object[] row : orderItemRepository.aggregateSoldByItem()) {
            map.put((Long) row[0], (BigDecimal) row[1]);
        }
        return map;
    }

    private static String resolveImageUrlForCreate(String requested, String itemCode) {
        if (requested != null && !requested.isBlank()) {
            return requested.trim();
        }
        return ItemImageUrls.defaultItemPath(itemCode);
    }

    private static String normalizeItemCode(String itemCode) {
        if (itemCode == null || itemCode.isBlank()) {
            throw new BadRequestException("Mã SKU không được để trống");
        }
        return itemCode.trim().replaceAll("\\s+", "-").toUpperCase();
    }

    private static String normalizeItemName(String itemName) {
        if (itemName == null || itemName.isBlank()) {
            throw new BadRequestException("Tên sản phẩm không được để trống");
        }
        return itemName.trim().replaceAll("\\s+", " ");
    }

    private ItemResponse toResponse(Item item, BigDecimal soldQty) {
        BigDecimal total = currentInventoryRepository.findByItemId(item.getId()).stream()
                .map(ci -> ci.getQuantity().subtract(ci.getReservedQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return ItemResponse.builder()
                .id(item.getId())
                .itemCode(item.getItemCode())
                .itemName(item.getItemName())
                .itemType(item.getItemType())
                .categoryId(item.getCategory() != null ? item.getCategory().getId() : null)
                .categoryName(item.getCategory() != null ? item.getCategory().getCategoryName() : null)
                .costPrice(resolveDisplayCostPrice(item))
                .sellingPrice(item.getSellingPrice())
                .minimumStock(item.getMinimumStock())
                .hasExpiry(item.isHasExpiry())
                .active(item.isActive())
                .totalAvailableQty(total)
                .soldQty(soldQty)
                .imageUrl(ItemImageUrls.resolve(item))
                .baseUomId(item.getBaseUom() != null ? item.getBaseUom().getId() : null)
                .baseUomName(item.getBaseUom() != null ? item.getBaseUom().getUomName() : null)
                .purchaseUomId(item.getPurchaseUom() != null ? item.getPurchaseUom().getId() : null)
                .purchaseUomName(item.getPurchaseUom() != null ? item.getPurchaseUom().getUomName() : null)
                .purchaseRatio(item.getPurchaseConversionRatio())
                .purchaseConversionRatio(item.getPurchaseConversionRatio())
                .build();
    }

    private String itemData(Item item) {
        return AuditData.of(
                "itemCode", item.getItemCode(),
                "itemName", item.getItemName(),
                "itemType", item.getItemType(),
                "categoryId", item.getCategory() != null
                        ? item.getCategory().getId()
                        : null,
                "baseUomId", item.getBaseUom() != null
                        ? item.getBaseUom().getId()
                        : null,
                "purchaseUomId", item.getPurchaseUom() != null
                        ? item.getPurchaseUom().getId()
                        : null,
                "costPrice", item.getCostPrice(),
                "sellingPrice", item.getSellingPrice(),
                "minimumStock", item.getMinimumStock(),
                "hasExpiry", item.isHasExpiry(),
                "purchaseConversionRatio", item.getPurchaseConversionRatio(),
                "active", item.isActive());
    }

    private void validateUomMatchesCategory(Uom uom, Category category) {
        if (uom == null || category == null || category.getUomCategories() == null || category.getUomCategories().isBlank()) {
            return;
        }

        List<String> allowed = Arrays.stream(category.getUomCategories().split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(String::toUpperCase)
                .toList();

        if (uom.getCategory() == null || !allowed.contains(uom.getCategory().toUpperCase())) {
            throw new BadRequestException("Đơn vị tính không phù hợp với danh mục sản phẩm");
        }
    }

    private BigDecimal resolveDisplayCostPrice(Item item) {
        BigDecimal averageSupplierCost = supplierItemRepository
                .averageDefaultCostPriceBySkuItem(item.getItemCode());

        return averageSupplierCost != null
                ? averageSupplierCost
                : item.getCostPrice();
    }
}
