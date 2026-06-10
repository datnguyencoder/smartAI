package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Setting extends LongAuditableEntity {

    @Column(name = "setting_key", nullable = false, unique = true)
    private String key;

    @Column(name = "setting_value", nullable = false)
    private String value;

    private String description;
}
