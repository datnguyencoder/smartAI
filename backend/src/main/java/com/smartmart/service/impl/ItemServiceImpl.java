package com.smartmart.service.impl;

import com.smartmart.common.response.PageResponse;
import com.smartmart.dto.request.CreateItemRequest;
import com.smartmart.dto.request.UpdateItemRequest;
import com.smartmart.dto.response.ItemResponse;
import com.smartmart.entity.Item;
import com.smartmart.entity.Uom;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.*;
import com.smartmart.util.ItemImageUrls;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ItemServiceImpl implements com.smartmart.service.ItemService {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final UomRepository uomRepository;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final OrderItemRepository orderItemRepository;

    public ItemServiceImpl(
            ItemRepository itemRepository,
            CategoryRepository categoryRepository,
            UomRepository uomRepository,
            CurrentInventoryRepository currentInventoryRepository,
            OrderItemRepository orderItemRepository
    ) {
        this.itemRepository = itemRepository;
        this.categoryRepository = categoryRepository;
        this.uomRepository = uomRepository;
        this.currentInventoryRepository = currentInventoryRepository;
        this.orderItemRepository = orderItemRepository;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "items", key = "'all:' + (#search == null ? '' : #search)")
    public List<ItemResponse> listAll(String search) {
        List<Item> items = (search == null || search.isBlank())
                ? itemRepository.findByActiveTrue()
                : itemRepository.searchActive(search.trim());
        return mapToResponses(items);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "itemsPage", key = "'p:' + #pageable.pageNumber + ':' + #pageable.pageSize + ':' + (#search == null ? '' : #search)")
    public PageResponse<ItemResponse> listPaged(String search, Pageable pageable) {
        Page<Item> page = (search == null || search.isBlank())
                ? itemRepository.findByActiveTrue(pageable)
                : itemRepository.searchActive(search.trim(), pageable);
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
        Item item = itemRepository.findActiveByItemCode(code.trim())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm với mã: " + code));
        BigDecimal sold = soldQtyMap().getOrDefault(item.getId(), BigDecimal.ZERO);
        return toResponse(item, sold);
    }

    @Override
    @CacheEvict(value = {"items", "itemsPage"}, allEntries = true)
    public ItemResponse create(CreateItemRequest req) {
        if (itemRepository.existsByItemCode(req.getItemCode())) {
            throw new BadRequestException("Mã sản phẩm đã tồn tại: " + req.getItemCode());
        }
        if (req.getSellingPrice().compareTo(req.getCostPrice()) < 0) {
            throw new BadRequestException("Giá bán phải >= giá nhập");
        }
        Uom baseUom = uomRepository.findById(req.getBaseUomId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn vị tính"));
        Uom purchaseUom = req.getPurchaseUomId() != null
                ? uomRepository.findById(req.getPurchaseUomId()).orElseThrow(() -> new NotFoundException("Không tìm thấy UOM nhập"))
                : baseUom;

        String imageUrl = resolveImageUrlForCreate(req.getImageUrl(), req.getItemCode());

        Item item = Item.builder()
                .itemCode(req.getItemCode())
                .itemName(req.getItemName())
                .itemType(req.getItemType())
                .category(req.getCategoryId() != null
                        ? categoryRepository.findById(req.getCategoryId()).orElse(null) : null)
                .baseUom(baseUom)
                .purchaseUom(purchaseUom)
                .costPrice(req.getCostPrice())
                .sellingPrice(req.getSellingPrice())
                .minimumStock(req.getMinimumStock() != null ? req.getMinimumStock() : 0)
                .hasExpiry(req.isHasExpiry())
                .active(true)
                .imageUrl(imageUrl)
                .build();
        return toResponse(itemRepository.save(item), BigDecimal.ZERO);
    }

    @Override
    @CacheEvict(value = {"items", "itemsPage"}, allEntries = true)
    public ItemResponse update(Long id, UpdateItemRequest req) {
        Item item = findItem(id);
        if (req.getItemName() != null && !req.getItemName().isBlank()) {
            item.setItemName(req.getItemName());
        }
        if (req.getItemType() != null) {
            item.setItemType(req.getItemType());
        }
        if (req.getCategoryId() != null) {
            item.setCategory(categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục")));
        }
        if (req.getBaseUomId() != null) {
            item.setBaseUom(uomRepository.findById(req.getBaseUomId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn vị tính")));
        }
        if (req.getPurchaseUomId() != null) {
            item.setPurchaseUom(uomRepository.findById(req.getPurchaseUomId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy UOM nhập")));
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
        return toResponse(itemRepository.save(item), sold);
    }

    @Override
    public Item findItem(Long id) {
        return itemRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm"));
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
                .costPrice(item.getCostPrice())
                .sellingPrice(item.getSellingPrice())
                .minimumStock(item.getMinimumStock())
                .hasExpiry(item.isHasExpiry())
                .active(item.isActive())
                .totalAvailableQty(total)
                .soldQty(soldQty)
                .imageUrl(ItemImageUrls.resolve(item))
                .build();
    }
}
