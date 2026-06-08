package com.smartmart.service;

import com.smartmart.common.response.PageResponse;
import com.smartmart.dto.request.CreateItemRequest;
import com.smartmart.dto.request.UpdateItemRequest;
import com.smartmart.dto.response.ItemResponse;
import com.smartmart.dto.response.UomResponse;
import com.smartmart.entity.Item;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ItemService {

    List<ItemResponse> listAll(String search, Long categoryId, Boolean active);

    PageResponse<ItemResponse> listPaged(String search, Long categoryId, Boolean active, Pageable pageable);

    ItemResponse getById(Long id);

    ItemResponse getByBarcode(String code);

    List<UomResponse> getItemUoms(Long id);

    ItemResponse create(CreateItemRequest req);

    ItemResponse update(Long id, UpdateItemRequest req);

    Item findItem(Long id);
}
