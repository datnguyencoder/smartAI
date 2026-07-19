package com.smartmart.service;

import com.smartmart.dto.request.CreateCategoryRequest;
import com.smartmart.dto.request.MoveCategoryItemsRequest;
import com.smartmart.dto.request.UpdateCategoryRequest;
import com.smartmart.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> listAll();

    CategoryResponse getById(Long id);

    CategoryResponse create(CreateCategoryRequest req);

    CategoryResponse update(Long id, UpdateCategoryRequest req);

    void delete(Long id);

    int moveItems(Long sourceCategoryId, MoveCategoryItemsRequest req);
}
