package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.common.response.PageResponse;
import com.smartmart.entity.Product;
import com.smartmart.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Product Management", description = "APIs for managing SmartMart products")
@SecurityRequirement(name = "bearerAuth")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    @Operation(summary = "Create a new product")
    public ResponseEntity<ApiResponse<Product>> createProduct(
            @Valid @RequestBody Product product,
            @RequestParam UUID categoryId,
            @RequestParam UUID supplierId
    ) {
        Product created = productService.createProduct(product, categoryId, supplierId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Sản phẩm đã được tạo thành công", created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID")
    public ResponseEntity<ApiResponse<Product>> getProductById(@PathVariable UUID id) {
        Product product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @GetMapping
    @Operation(summary = "Get all products with pagination")
    public ResponseEntity<ApiResponse<PageResponse<Product>>> getAllProducts(Pageable pageable) {
        PageResponse<Product> response = PageResponse.of(productService.getAllProducts(pageable));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update product details")
    public ResponseEntity<ApiResponse<Product>> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody Product productDetails
    ) {
        Product updated = productService.updateProduct(id, productDetails);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật sản phẩm thành công", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a product")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable UUID id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa sản phẩm thành công", null));
    }

    @PatchMapping("/{id}/adjust-stock")
    @Operation(summary = "Adjust stock quantity of a product")
    public ResponseEntity<ApiResponse<Product>> adjustStock(
            @PathVariable UUID id,
            @RequestParam Integer quantity,
            @RequestParam String reason
    ) {
        Product adjusted = productService.adjustStock(id, quantity, reason);
        return ResponseEntity.ok(ApiResponse.success("Điều chỉnh tồn kho thành công", adjusted));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Get all low stock products")
    public ResponseEntity<ApiResponse<List<Product>>> getLowStockProducts() {
        List<Product> list = productService.getLowStockProducts();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách sản phẩm sắp hết hàng thành công", list));
    }
}
