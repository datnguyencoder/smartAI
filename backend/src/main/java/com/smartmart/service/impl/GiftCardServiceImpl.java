package com.smartmart.service.impl;

import com.smartmart.dto.request.IssueGiftCardRequest;
import com.smartmart.dto.request.RedeemGiftCardRequest;
import com.smartmart.dto.response.GiftCardResponse;
import com.smartmart.entity.GiftCard;
import com.smartmart.enums.GiftCardStatus;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.GiftCardRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.GiftCardService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class GiftCardServiceImpl implements GiftCardService {

    private final GiftCardRepository giftCardRepository;

    public GiftCardServiceImpl(GiftCardRepository giftCardRepository) {
        this.giftCardRepository = giftCardRepository;
    }

    @Override
    public GiftCardResponse issue(IssueGiftCardRequest request) {
        String cardCode = "GC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        GiftCard card = GiftCard.builder()
                .cardCode(cardCode)
                .initialBalance(request.getInitialBalance())
                .currentBalance(request.getInitialBalance())
                .status(GiftCardStatus.ACTIVE)
                .issuedAt(LocalDateTime.now())
                .expiresAt(request.getExpiresAt())
                .issuedBy(SecurityUtils.getCurrentUserId().orElse(null))
                .note(request.getNote())
                .build();
        return toResponse(giftCardRepository.save(card));
    }

    @Override
    public GiftCardResponse redeem(RedeemGiftCardRequest request) {
        GiftCard card = giftCardRepository.findByCardCodeIgnoreCase(request.getCardCode().trim())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thẻ quà tặng"));
        validateActive(card);
        if (card.getCurrentBalance().compareTo(request.getAmount()) < 0) {
            throw new BadRequestException("Số dư thẻ không đủ");
        }
        card.setCurrentBalance(card.getCurrentBalance().subtract(request.getAmount()));
        if (card.getCurrentBalance().compareTo(java.math.BigDecimal.ZERO) == 0) {
            card.setStatus(GiftCardStatus.REDEEMED);
        }
        return toResponse(giftCardRepository.save(card));
    }

    @Override
    @Transactional(readOnly = true)
    public GiftCardResponse getBalance(String cardCode) {
        GiftCard card = giftCardRepository.findByCardCodeIgnoreCase(cardCode.trim())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thẻ quà tặng"));
        return toResponse(card);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GiftCardResponse> listActive() {
        return giftCardRepository.findByStatusOrderByCreatedAtDesc(GiftCardStatus.ACTIVE).stream()
                .map(this::toResponse).toList();
    }

    private void validateActive(GiftCard card) {
        if (card.getStatus() != GiftCardStatus.ACTIVE) {
            throw new BadRequestException("Thẻ quà tặng không còn hoạt động");
        }
        if (card.getExpiresAt() != null && card.getExpiresAt().isBefore(LocalDate.now())) {
            card.setStatus(GiftCardStatus.EXPIRED);
            giftCardRepository.save(card);
            throw new BadRequestException("Thẻ quà tặng đã hết hạn");
        }
    }

    private GiftCardResponse toResponse(GiftCard card) {
        return GiftCardResponse.builder()
                .id(card.getId())
                .cardCode(card.getCardCode())
                .initialBalance(card.getInitialBalance())
                .currentBalance(card.getCurrentBalance())
                .status(card.getStatus())
                .issuedAt(card.getIssuedAt())
                .expiresAt(card.getExpiresAt())
                .note(card.getNote())
                .build();
    }
}
