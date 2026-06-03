package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "locations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Location extends LongAuditableEntity {

    @Column(name = "location_name", nullable = false)
    private String locationName;

    @Column(name = "location_type")
    private String locationType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Location parent;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
