package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateUomRequest;
import com.smartmart.dto.request.UpdateUomRequest;
import com.smartmart.dto.response.UomResponse;
import com.smartmart.service.UomService;
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
@RequestMapping("/api/v1/uoms")
@Tag(name = "UOMs", description = "Đơn vị tính")
@SecurityRequirement(name = "bearerAuth")
public class UomController {

    private final UomService uomService;

    public UomController(UomService uomService) {
        this.uomService = uomService;
    }

    @GetMapping
    @Operation(summary = "Danh sách UOM")
    public ResponseEntity<ApiResponse<List<UomResponse>>> list(@RequestParam(required = false) String categories) {
        return ResponseEntity.ok(ApiResponse.success(uomService.listByCategories(categories)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Tạo UOM")
    public ResponseEntity<ApiResponse<UomResponse>> create(@Valid @RequestBody CreateUomRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo UOM thành công", uomService.create(request)));
    }
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Cập nhật UOM")
    public ResponseEntity<ApiResponse<UomResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUomRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật đơn vị tính thành công", uomService.update(id, request))
        );
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Ngưng hoạt động UOM")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        uomService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("Ngưng hoạt động đơn vị tính thành công", null));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Kích hoạt UOM")
    public ResponseEntity<ApiResponse<Void>> activate(@PathVariable Long id) {
        uomService.activate(id);
        return ResponseEntity.ok(ApiResponse.success("Kích hoạt đơn vị tính thành công", null));
    }
}
