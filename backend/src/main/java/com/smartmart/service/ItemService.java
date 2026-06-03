package com.smartmart.service;

import com.smartmart.dto.request.CreateItemRequest;
import com.smartmart.dto.response.ItemResponse;
import com.smartmart.entity.Item;

import java.util.List;

public interface ItemService {

    List<ItemResponse> listAll(String search);

    ItemResponse getById(Long id);

    ItemResponse create(CreateItemRequest req);

    Item findItem(Long id);
}
