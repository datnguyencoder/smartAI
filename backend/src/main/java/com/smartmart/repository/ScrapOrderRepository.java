package com.smartmart.repository;

import com.smartmart.entity.ScrapOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ScrapOrderRepository extends JpaRepository<ScrapOrder, Long> {
    @Override
    @EntityGraph(attributePaths = {"items", "items.item", "items.lot", "location"})
    List<ScrapOrder> findAll();

    @EntityGraph(attributePaths = {"items", "items.item", "items.lot", "location"})
    List<ScrapOrder> findAllByOrderByIdDesc();

    @EntityGraph(attributePaths = {"items", "items.item", "items.lot", "location"})
    Optional<ScrapOrder> findById(Long id);
}
