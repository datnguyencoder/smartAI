package com.smartmart.repository;

import com.smartmart.entity.ItemLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.smartmart.entity.Item;
import java.util.List;
import java.util.Optional;

public interface ItemLotRepository extends JpaRepository<ItemLot, Long> {
    Optional<ItemLot> findByItemIdAndLotNumber(Long itemId, String lotNumber);
    List<ItemLot> findAllByOrderByIdDesc();

    Optional<ItemLot> findByItemAndLotNumber(Item item, String lotNumber);

    List<ItemLot> findByItemId(Long itemId);

    List<ItemLot> findByLotNumberContainingIgnoreCase(String lotNumber);

    List<ItemLot> findByItemIdAndLotNumberContainingIgnoreCase(Long itemId, String lotNumber);

    @Query("""
        SELECT l FROM ItemLot l
        WHERE l.item.id = :itemId
        ORDER BY CASE WHEN l.expiryDate IS NULL THEN 1 ELSE 0 END, l.expiryDate ASC
        """)
    List<ItemLot> findByItemIdOrderByFefo(Long itemId);
}
