package com.smartmart.repository;

import com.smartmart.entity.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {
    Optional<Item> findByItemCode(String itemCode);
    boolean existsByItemCode(String itemCode);
    List<Item> findByActiveTrue();
    Page<Item> findByActiveTrue(Pageable pageable);

    @Query("SELECT i FROM Item i WHERE i.active = true AND " +
           "(LOWER(i.itemName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(i.itemCode) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Item> searchActive(String q);

    @Query("SELECT i FROM Item i WHERE i.active = true AND " +
           "(LOWER(i.itemName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(i.itemCode) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Item> searchActive(String q, Pageable pageable);

    @Query("SELECT i FROM Item i WHERE i.active = true AND LOWER(i.itemCode) = LOWER(:code)")
    Optional<Item> findActiveByItemCode(String code);
}
