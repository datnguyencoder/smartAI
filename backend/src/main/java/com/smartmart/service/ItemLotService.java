package com.smartmart.service;

import com.smartmart.dto.response.ItemLotResponse;
import java.util.List;

public interface ItemLotService {

    List<ItemLotResponse> listItemLots(Long itemId, String lotNumber);

    ItemLotResponse getItemLotById(Long id);

}
