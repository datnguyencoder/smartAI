package com.smartmart.service;

import com.smartmart.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ProductService {
    Product createProduct(Product product, UUID categoryId, UUID supplierId);
    Product getProductById(UUID id);
    Page<Product> getAllProducts(Pageable pageable);
    Product updateProduct(UUID id, Product productDetails);
    void deleteProduct(UUID id);
    Product adjustStock(UUID id, Integer quantity, String reason);
    List<Product> getLowStockProducts();
}
