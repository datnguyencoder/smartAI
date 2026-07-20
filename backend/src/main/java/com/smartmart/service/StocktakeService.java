package com.smartmart.service;

import com.smartmart.dto.request.ConfirmStocktakeRequest;
import com.smartmart.dto.request.CreateStocktakeRequest;
import com.smartmart.dto.response.StocktakeResponse;
import com.smartmart.entity.Stocktake;
import com.smartmart.enums.StocktakeStatus;

import java.util.List;

public interface StocktakeService {
    Stocktake create(CreateStocktakeRequest request);
    Stocktake submitForApproval(Long id, ConfirmStocktakeRequest request);
    Stocktake approve(Long id);
    Stocktake cancel(Long id);
    Stocktake findById(Long id);
    List<Stocktake> listAll(StocktakeStatus status);
    void enrichUsernames(List<StocktakeResponse> responses);
}
