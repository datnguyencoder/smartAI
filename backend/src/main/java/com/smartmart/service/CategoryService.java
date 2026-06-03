package com.smartmart.service;

import com.smartmart.dto.request.CreateCategoryRequest;
import com.smartmart.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> listAll();

    CategoryResponse create(CreateCategoryRequest req);
}
