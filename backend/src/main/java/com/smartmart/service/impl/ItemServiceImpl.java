package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateItemRequest;
import com.smartmart.dto.response.ItemResponse;
import com.smartmart.entity.Item;
import com.smartmart.entity.Uom;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class ItemServiceImpl implements com.smartmart.service.ItemService {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final UomRepository uomRepository;
    private final CurrentInventoryRepository currentInventoryRepository;

    public ItemServiceImpl(
            ItemRepository itemRepository,
            CategoryRepository categoryRepository,
            UomRepository uomRepository,
            CurrentInventoryRepository currentInventoryRepository
    ) {
        this.itemRepository = itemRepository;
        this.categoryRepository = categoryRepository;
        this.uomRepository = uomRepository;
        this.currentInventoryRepository = currentInventoryRepository;
    }

    @Transactional(readOnly = true)
    public List<ItemResponse> listAll(String search) {
        List<Item> items = (search == null || search.isBlank())
                ? itemRepository.findByActiveTrue()
                : itemRepository.searchActive(search.trim());
        return items.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ItemResponse getById(Long id) {
        return toResponse(findItem(id));
    }

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
                .build();
        return toResponse(itemRepository.save(item));
    }

    public Item findItem(Long id) {
        return itemRepository.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm"));
    }

    private ItemResponse toResponse(Item item) {
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
                .build();
    }
}
