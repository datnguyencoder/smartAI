package com.smartmart.service;

import com.smartmart.dto.request.IssueGiftCardRequest;
import com.smartmart.dto.request.RedeemGiftCardRequest;
import com.smartmart.dto.response.GiftCardResponse;

import java.util.List;

public interface GiftCardService {
    GiftCardResponse issue(IssueGiftCardRequest request);

    GiftCardResponse redeem(RedeemGiftCardRequest request);

    GiftCardResponse getBalance(String cardCode);

    List<GiftCardResponse> listActive();
}
