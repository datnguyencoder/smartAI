package com.smartmart.repository;

import com.smartmart.entity.Stocktake;
import com.smartmart.enums.StocktakeStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StocktakeRepository extends JpaRepository<Stocktake, Long> {
    List<Stocktake> findAllByOrderByIdDesc();
    List<Stocktake> findByStatusOrderByIdDesc(StocktakeStatus status);
}
