package com.smartmart.repository;

import com.smartmart.entity.GiftCard;
import com.smartmart.enums.GiftCardStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GiftCardRepository extends JpaRepository<GiftCard, Long> {
    Optional<GiftCard> findByCardCodeIgnoreCase(String cardCode);

    List<GiftCard> findByStatusOrderByCreatedAtDesc(GiftCardStatus status);
}
