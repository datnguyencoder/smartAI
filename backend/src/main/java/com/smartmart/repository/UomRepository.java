package com.smartmart.repository;

import com.smartmart.entity.Uom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UomRepository extends JpaRepository<Uom, Long> {
    Optional<Uom> findByUomName(String uomName);
    List<Uom> findAllByOrderByIdDesc();
}
