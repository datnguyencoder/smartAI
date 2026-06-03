package com.smartmart.entity;

import com.smartmart.common.base.LongAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "suppliers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Supplier extends LongAuditableEntity {

    @Column(name = "supplier_name", nullable = false)
    private String supplierName;

    @Column(name = "contact_person")
    private String contactPerson;

    private String phone;
    private String email;
    private String address;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
