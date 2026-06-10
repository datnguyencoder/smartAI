package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateItemLotRequest;
import com.smartmart.dto.request.UpdateItemLotRequest;
import com.smartmart.dto.response.ItemLotResponse;
import com.smartmart.entity.Item;
import com.smartmart.entity.ItemLot;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.ItemLotRepository;
import com.smartmart.repository.ItemRepository;
import com.smartmart.service.ItemLotService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ItemLotServiceImpl implements ItemLotService {

    private final ItemLotRepository itemLotRepository;
    private final ItemRepository itemRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ItemLotResponse> listItemLots(Long itemId, String lotNumber) {
        List<ItemLot> lots;
        if (itemId != null && lotNumber != null) {
            lots = itemLotRepository.findByItemIdAndLotNumberContainingIgnoreCase(itemId, lotNumber);
        } else if (itemId != null) {
            lots = itemLotRepository.findByItemId(itemId);
        } else if (lotNumber != null) {
            lots = itemLotRepository.findByLotNumberContainingIgnoreCase(lotNumber);
        } else {
            lots = itemLotRepository.findAllByOrderByIdDesc();
        }
        return lots.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ItemLotResponse getItemLotById(Long id) {
        ItemLot lot = itemLotRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lô hàng với ID: " + id));
        return toResponse(lot);
    }



    private ItemLotResponse toResponse(ItemLot lot) {
        return ItemLotResponse.builder()
                .id(lot.getId())
                .itemId(lot.getItem().getId())
                .itemName(lot.getItem().getItemName())
                .lotNumber(lot.getLotNumber())
                .expiryDate(lot.getExpiryDate())
                .createdAt(lot.getCreatedAt())
                .build();
    }
}
