package com.smartmart.dto.request;

import com.smartmart.enums.OnlineOrderRequestStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateOnlineOrderRequestStatusRequest {
    @NotNull
    private OnlineOrderRequestStatus status;
}
