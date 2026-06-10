package com.smartmart.repository;

import com.smartmart.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LocationRepository extends JpaRepository<Location, Long> {
    Optional<Location> findByLocationName(String locationName);

    List<Location> findByActiveTrueOrderByIdDesc();

    @org.springframework.data.jpa.repository.Query("SELECT l FROM Location l WHERE " +
            "(:q = '' OR LOWER(l.locationName) LIKE LOWER(CONCAT('%', :q, '%'))) " +
            "AND (:type IS NULL OR l.locationType = :type) " +
            "AND (:active IS NULL OR l.active = :active) " +
            "ORDER BY l.id DESC")
    java.util.List<Location> findFiltered(@org.springframework.data.repository.query.Param("q") String q,
            @org.springframework.data.repository.query.Param("type") String type,
            @org.springframework.data.repository.query.Param("active") Boolean active);
}
