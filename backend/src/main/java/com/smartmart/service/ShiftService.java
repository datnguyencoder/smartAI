package com.smartmart.service;

import com.smartmart.dto.request.CloseShiftRequest;
import com.smartmart.dto.request.OpenShiftRequest;
import com.smartmart.entity.Shift;

import java.util.List;
import java.util.Optional;

public interface ShiftService {
    Shift openShift(OpenShiftRequest request);
    Shift closeShift(Long id, CloseShiftRequest request);
    Optional<Shift> getOpenShiftForCurrentUser();
    Shift findById(Long id);
    List<Shift> listAll();
    List<Shift> listByCashier(Long cashierId);
}
