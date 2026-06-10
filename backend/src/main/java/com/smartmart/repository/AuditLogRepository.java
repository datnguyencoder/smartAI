package com.smartmart.repository;

import com.smartmart.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByUserId(Long userId);

    @Query("""
            SELECT auditLog
            FROM AuditLog auditLog
            LEFT JOIN FETCH auditLog.user
            WHERE auditLog.action NOT LIKE 'AUTH_%'
            ORDER BY auditLog.createdAt DESC
            """)
    List<AuditLog> findRecentBusinessActivities(Pageable pageable);

    @Query(
            value = """
                SELECT auditLog
                FROM AuditLog auditLog
                LEFT JOIN FETCH auditLog.user user
                WHERE LOWER(user.username) LIKE LOWER(CONCAT('%', :username, '%'))
                ORDER BY auditLog.createdAt DESC
                """,
            countQuery = """
                SELECT COUNT(auditLog)
                FROM AuditLog auditLog
                JOIN auditLog.user user
                WHERE LOWER(user.username) LIKE LOWER(CONCAT('%', :username, '%'))
                """
    )
    Page<AuditLog> findByUsernameContainingIgnoreCase(
            @Param("username") String username,
            Pageable pageable
    );

    @Query("""
        SELECT auditLog
        FROM AuditLog auditLog
        LEFT JOIN FETCH auditLog.user
        WHERE auditLog.action = :action
        ORDER BY auditLog.createdAt DESC
        """)
    Page<AuditLog> findByActionOrderByCreatedAtDesc(@Param("action") String action, Pageable pageable);

    Page<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(@Param("entityType") String entityType, String entityId, Pageable pageable);

    @Query("""
        SELECT auditLog
        FROM AuditLog auditLog
        LEFT JOIN FETCH auditLog.user
        ORDER BY auditLog.createdAt DESC
        """)
    Page<AuditLog> findAllOrderByCreatedAtDesc(Pageable pageable);

    Page<AuditLog> findByEntityTypeOrderByCreatedAtDesc(String entityType, Pageable pageable);

    @Query("""
    SELECT DISTINCT auditLog.action
    FROM AuditLog auditLog
    WHERE (:entityType IS NULL OR auditLog.entityType = :entityType)
    ORDER BY auditLog.action ASC
    """)
    List<String> findDistinctActions(@Param("entityType") String entityType);
}
