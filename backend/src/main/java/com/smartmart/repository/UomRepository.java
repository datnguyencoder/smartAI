package com.smartmart.repository;

import com.smartmart.entity.Uom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UomRepository extends JpaRepository<Uom, Long> {
    List<Uom> findAllByOrderByIdDesc();
    boolean existsByUomNameIgnoreCase(String uomName);

    boolean existsByUomNameIgnoreCaseAndIdNot(String uomName, Long id);

    @Query("""
    SELECT u
    FROM Uom u
    WHERE u.active = true
      AND UPPER(u.category) IN :categories
    ORDER BY u.id DESC
""")
    List<Uom> findActiveByCategoryInIgnoreCaseOrderByIdDesc(@Param("categories") List<String> categories);

    List<Uom> findByActiveTrueOrderByIdDesc();

    List<Uom> findByCategoryIgnoreCaseAndActiveTrueOrderByIdDesc(String category);

    @Query("SELECT DISTINCT u.category FROM Uom u WHERE u.category IS NOT NULL AND u.category <> '' ORDER BY u.category")
    List<String> findDistinctCategories();
}
