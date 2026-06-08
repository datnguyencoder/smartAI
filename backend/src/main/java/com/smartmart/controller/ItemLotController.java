package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.response.ItemLotResponse;
import com.smartmart.service.ItemLotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/item-lots")
@Tag(name = "Item Lots", description = "Quản lý Lô hàng")
@RequiredArgsConstructor
public class ItemLotController {

    private final ItemLotService itemLotService;

    @GetMapping
    @Operation(summary = "Lấy danh sách các lô hàng")
    public ResponseEntity<ApiResponse<List<ItemLotResponse>>> listItemLots(
            @RequestParam(required = false) Long itemId,
            @RequestParam(required = false) String lotNumber) {
        List<ItemLotResponse> list = itemLotService.listItemLots(itemId, lotNumber);
        return ResponseEntity.ok(ApiResponse.success("Thành công", list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết một lô hàng")
    public ResponseEntity<ApiResponse<ItemLotResponse>> getItemLotById(@PathVariable Long id) {
        ItemLotResponse lot = itemLotService.getItemLotById(id);
        return ResponseEntity.ok(ApiResponse.success("Thành công", lot));
    }

}
