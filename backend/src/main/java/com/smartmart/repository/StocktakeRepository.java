package com.smartmart.repository;

import com.smartmart.entity.Stocktake;
import com.smartmart.enums.StocktakeStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StocktakeRepository extends JpaRepository<Stocktake, Long> {
    @Override
    @EntityGraph(attributePaths = {"location", "items", "items.item", "items.lot"})
    Optional<Stocktake> findById(Long id);

    @EntityGraph(attributePaths = {"location", "items", "items.item", "items.lot"})
    List<Stocktake> findAllByOrderByIdDesc();

    @EntityGraph(attributePaths = {"location", "items", "items.item", "items.lot"})
    List<Stocktake> findByStatusOrderByIdDesc(StocktakeStatus status);
}
