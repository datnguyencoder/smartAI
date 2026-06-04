package com.smartmart.service;

import com.smartmart.dto.response.InventoryAlertResponse;
import com.smartmart.entity.Item;

import java.util.List;

public interface InventoryAlertService {

    void evaluateStockAfterSale(Long itemId);

    void evaluateStock(Item item);

    List<InventoryAlertResponse> listUnresolved();

    InventoryAlertResponse resolve(Long alertId);
}
