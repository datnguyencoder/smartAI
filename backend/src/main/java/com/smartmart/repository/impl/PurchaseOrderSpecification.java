package com.smartmart.repository.impl;

import com.smartmart.entity.PurchaseOrder;
import com.smartmart.enums.PurchaseStatus;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class PurchaseOrderSpecification {

    public static Specification<PurchaseOrder> filterBy(Long supplierId, PurchaseStatus status, LocalDate fromDate, LocalDate toDate) {
        return (root, query, criteriaBuilder) -> {
            // Prevent MultipleBagFetchException / Fetch in count queries
            if (Long.class != query.getResultType() && long.class != query.getResultType()) {
                root.fetch("supplier", JoinType.LEFT);
                root.fetch("location", JoinType.LEFT);
            }

            var predicate = criteriaBuilder.conjunction();

            if (supplierId != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("supplier").get("id"), supplierId));
            }

            if (status != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("status"), status));
            }

            if (fromDate != null) {
                LocalDateTime startOfDay = fromDate.atStartOfDay();
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.greaterThanOrEqualTo(root.get("purchaseDate"), startOfDay));
            }

            if (toDate != null) {
                LocalDateTime endOfDay = toDate.atTime(23, 59, 59);
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.lessThanOrEqualTo(root.get("purchaseDate"), endOfDay));
            }

            return predicate;
        };
    }
}
