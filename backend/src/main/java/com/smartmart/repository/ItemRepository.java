package com.smartmart.repository;

import com.smartmart.entity.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {
       Optional<Item> findByItemCode(String itemCode);

       boolean existsByItemCode(String itemCode);

       List<Item> findByActiveTrue();

       Page<Item> findByActiveTrue(Pageable pageable);

       @Query("SELECT i FROM Item i WHERE i.active = true AND " +
                     "(LOWER(i.itemName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(i.itemCode) LIKE LOWER(CONCAT('%', :q, '%'))) " +
                     "ORDER BY i.id DESC")
       List<Item> searchActive(String q);

       @Query("SELECT i FROM Item i WHERE i.active = true AND " +
                     "(LOWER(i.itemName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(i.itemCode) LIKE LOWER(CONCAT('%', :q, '%')))")
       Page<Item> searchActive(String q, Pageable pageable);

       @Query("SELECT i FROM Item i WHERE i.active = true AND LOWER(i.itemCode) = LOWER(:code)")
       Optional<Item> findActiveByItemCode(String code);

       @Query("SELECT i FROM Item i WHERE " +
                     "(:q = '' OR LOWER(i.itemName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(i.itemCode) LIKE LOWER(CONCAT('%', :q, '%'))) "
                     +
                     "AND (:categoryId IS NULL OR i.category.id = :categoryId) " +
                     "AND (:active IS NULL OR i.active = :active) " +
                     "ORDER BY i.id DESC")
       List<Item> searchFiltered(@org.springframework.data.repository.query.Param("q") String q,
                     @org.springframework.data.repository.query.Param("categoryId") Long categoryId,
                     @org.springframework.data.repository.query.Param("active") Boolean active);

       @Query("SELECT i FROM Item i WHERE " +
                     "(:q = '' OR LOWER(i.itemName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(i.itemCode) LIKE LOWER(CONCAT('%', :q, '%'))) "
                     +
                     "AND (:categoryId IS NULL OR i.category.id = :categoryId) " +
                     "AND (:active IS NULL OR i.active = :active)")
       Page<Item> searchFilteredPaged(@org.springframework.data.repository.query.Param("q") String q,
                     @org.springframework.data.repository.query.Param("categoryId") Long categoryId,
                     @org.springframework.data.repository.query.Param("active") Boolean active, Pageable pageable);

       @Lock(LockModeType.PESSIMISTIC_WRITE)
       @Query("SELECT i FROM Item i WHERE i.id = :id")
       Optional<Item> findByIdWithPessimisticLock(@org.springframework.data.repository.query.Param("id") Long id);
}
