package com.smartmart.service;

import com.smartmart.dto.request.CreateScrapOrderRequest;
import com.smartmart.entity.ScrapOrder;
import com.smartmart.entity.ScrapOrderItem;

import java.util.List;

public interface ScrapOrderService {

    ScrapOrder create(CreateScrapOrderRequest request);

    ScrapOrder complete(ScrapOrder scrap);

    ScrapOrder createDraft(Long locationId, List<ScrapOrderItem> items);

    ScrapOrder findById(Long id);

    List<ScrapOrder> listAll();
}
