package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.IssueGiftCardRequest;
import com.smartmart.dto.request.RedeemGiftCardRequest;
import com.smartmart.dto.response.GiftCardResponse;
import com.smartmart.service.GiftCardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/gift-cards")
@Tag(name = "Gift Cards", description = "Thẻ quà tặng")
@SecurityRequirement(name = "bearerAuth")
public class GiftCardController {

    private final GiftCardService giftCardService;

    public GiftCardController(GiftCardService giftCardService) {
        this.giftCardService = giftCardService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Phát hành thẻ quà tặng")
    public ResponseEntity<ApiResponse<GiftCardResponse>> issue(@Valid @RequestBody IssueGiftCardRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Phát hành thẻ thành công", giftCardService.issue(request)));
    }

    @PostMapping("/redeem")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER')")
    @Operation(summary = "Sử dụng thẻ quà tặng")
    public ResponseEntity<ApiResponse<GiftCardResponse>> redeem(@Valid @RequestBody RedeemGiftCardRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Sử dụng thẻ thành công", giftCardService.redeem(request)));
    }

    @GetMapping("/balance/{cardCode}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER')")
    @Operation(summary = "Kiểm tra số dư thẻ")
    public ResponseEntity<ApiResponse<GiftCardResponse>> balance(@PathVariable String cardCode) {
        return ResponseEntity.ok(ApiResponse.success(giftCardService.getBalance(cardCode)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Danh sách thẻ đang hoạt động")
    public ResponseEntity<ApiResponse<List<GiftCardResponse>>> listActive() {
        return ResponseEntity.ok(ApiResponse.success(giftCardService.listActive()));
    }
}
