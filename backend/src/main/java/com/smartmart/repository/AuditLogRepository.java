package com.smartmart.repository;

import com.smartmart.entity.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByUserId(UUID userId);

    @Query("""
            SELECT auditLog
            FROM AuditLog auditLog
            LEFT JOIN FETCH auditLog.user
            WHERE auditLog.action NOT LIKE 'AUTH_%'
            ORDER BY auditLog.createdAt DESC
            """)
    List<AuditLog> findRecentBusinessActivities(Pageable pageable);
}
