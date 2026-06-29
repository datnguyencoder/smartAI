package com.smartmart.service;

import com.smartmart.dto.request.CloseShiftRequest;
import com.smartmart.dto.request.OpenShiftRequest;
import com.smartmart.dto.request.ReviewShiftRequest;
import com.smartmart.dto.response.ShiftSummaryResponse;
import com.smartmart.entity.Shift;

import java.util.List;
import java.util.Optional;

public interface ShiftService {
    Shift openShift(OpenShiftRequest request);
    Shift closeShift(Long id, CloseShiftRequest request);
    Shift reviewShift(Long id, ReviewShiftRequest request);
    Optional<Shift> getOpenShiftForCurrentUser();
    Shift findById(Long id);
    List<Shift> listAll();
    List<Shift> listByCashier(Long cashierId);
    ShiftSummaryResponse getSummary(Long id);
}
