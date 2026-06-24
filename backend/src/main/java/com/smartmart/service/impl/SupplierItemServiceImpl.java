package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateSupplierItemRequest;
import com.smartmart.dto.request.UpdateSupplierItemRequest;
import com.smartmart.dto.response.ItemResponse;
import com.smartmart.dto.response.SupplierItemResponse;
import com.smartmart.entity.Item;
import com.smartmart.entity.Supplier;
import com.smartmart.entity.SupplierItem;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.ItemRepository;
import com.smartmart.repository.SupplierItemRepository;
import com.smartmart.repository.SupplierRepository;
import com.smartmart.service.ItemService;
import com.smartmart.service.SupplierItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class SupplierItemServiceImpl implements SupplierItemService {
    private final SupplierItemRepository supplierItemRepository;
    private final SupplierRepository supplierRepository;
    private final ItemRepository itemRepository;

    @Override
    public SupplierItemResponse create(CreateSupplierItemRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId()).orElseThrow(() -> new NotFoundException("Không tìm thấy nhà cung cấp"));
        if(!supplier.isActive()) {
            throw new BadRequestException("Nhà cung cấp đã ngừng hoạt động");
        }
        Item item = itemRepository.findByItemCode(request.getSkuItem()).orElseThrow(()-> new NotFoundException("Không tìm thấy sản phẩm"));
        if(!item.isActive()) {
            throw new BadRequestException("Sản phẩm đã ngừng kinh doanh");
        }
        boolean exists = supplierItemRepository.findBySupplierIdAndSkuItemIgnoreCase(supplier.getId(), request.getSkuItem()).isPresent();
        if(exists){
            throw new BadRequestException("Nhà cung cấp đã có sản phẩm này");
        }
        SupplierItem supplierItem = SupplierItem.builder()
                .supplier(supplier)
                .skuItem(item.getItemCode())
                .defaultCostPrice(request.getDefaultCostPrice())
                .active(true)
                .build();
        return toResponse(supplierItemRepository.save(supplierItem));
    }

    @Override
    public SupplierItemResponse update(Long id, UpdateSupplierItemRequest request) {
        SupplierItem supplierItem = supplierItemRepository.findById(id).orElseThrow(()-> new NotFoundException("Không tìm thấy sản phẩm của nhà cung cấp"));
        if(request.getDefaultCostPrice() != null) {
            supplierItem.setDefaultCostPrice(request.getDefaultCostPrice());
        }
        return toResponse(supplierItemRepository.save(supplierItem));
    }

    @Override
    public void deactivate(Long id) {
        SupplierItem supplierItem = supplierItemRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm của nhà cung cấp"));

        supplierItem.setActive(false);
        supplierItemRepository.save(supplierItem);
    }

    @Override
    public List<SupplierItemResponse> listBySupplier(Long supplierId) {
        return supplierItemRepository.findBySupplierIdAndActiveTrue(supplierId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<ItemResponse> listItemsBySupplier(Long supplierId) {
        return supplierItemRepository.findBySupplierIdAndActiveTrue(supplierId)
                .stream()
                .map(SupplierItem::getItem)
                .filter(item -> item != null && item.isActive())
                .map(this::toItemResponse)
                .toList();
    }

    @Override
    public void validateItemSuppliedBySupplier(Long supplierId, String skuItem) {
        boolean valid = supplierItemRepository
                .existsBySupplierIdAndSkuItemIgnoreCaseAndActiveTrue(supplierId, skuItem);

        if (!valid) {
            throw new BadRequestException("Nhà cung cấp không cung cấp sản phẩm này");
        }
    }

    @Override
    public void activate(Long id) {
        SupplierItem supplierItem = supplierItemRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm của nhà cung cấp"));

        supplierItem.setActive(true);
        supplierItemRepository.save(supplierItem);
    }

    private ItemResponse toItemResponse(Item item) {
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
                .imageUrl(item.getImageUrl())
                .baseUomId(item.getBaseUom() != null ? item.getBaseUom().getId() : null)
                .baseUomName(item.getBaseUom() != null ? item.getBaseUom().getUomName() : null)
                .purchaseUomId(item.getPurchaseUom() != null ? item.getPurchaseUom().getId() : null)
                .purchaseUomName(item.getPurchaseUom() != null ? item.getPurchaseUom().getUomName() : null)
                .build();
    }

    private SupplierItemResponse toResponse(SupplierItem supplierItem) {
        Item item = supplierItem.getItem();
        Supplier supplier = supplierItem.getSupplier();

        return SupplierItemResponse.builder()
                .id(supplierItem.getId())
                .supplierId(supplier != null ? supplier.getId() : null)
                .supplierName(supplier != null ? supplier.getSupplierName() : null)
                .itemId(item != null ? item.getId() : null)
                .skuItem(supplierItem.getSkuItem())
                .itemName(item != null ? item.getItemName() : null)
                .defaultCostPrice(supplierItem.getDefaultCostPrice())
                .active(supplierItem.isActive())
                .build();
    }
}
