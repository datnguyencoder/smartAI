package com.smartmart.entity.Chat;

import com.smartmart.common.base.LongAuditableEntity;
import com.smartmart.enums.AttachmentType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "attachments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Attachment extends LongAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @Enumerated(EnumType.STRING)
    @Column(name = "attachment_type", nullable = false)
    private AttachmentType attachmentType;

    @Column(nullable = false)
    private String url;

    @Column(name = "public_id")
    private String publicId;

    @Column(name = "file_type")
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;
}
