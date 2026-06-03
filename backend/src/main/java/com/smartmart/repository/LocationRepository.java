package com.smartmart.repository;

import com.smartmart.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LocationRepository extends JpaRepository<Location, Long> {
    Optional<Location> findByLocationName(String locationName);
    List<Location> findByActiveTrue();
}
