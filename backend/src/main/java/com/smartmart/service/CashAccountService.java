package com.smartmart.service;

import com.smartmart.dto.request.CreateAccountTransferRequest;
import com.smartmart.dto.request.CreateCashAccountRequest;
import com.smartmart.dto.response.AccountTransferResponse;
import com.smartmart.dto.response.CashAccountResponse;

import java.util.List;

public interface CashAccountService {
    CashAccountResponse create(CreateCashAccountRequest request);

    CashAccountResponse getById(Long id);

    List<CashAccountResponse> listAll();

    AccountTransferResponse transfer(CreateAccountTransferRequest request);

    List<AccountTransferResponse> listTransfers();
}
