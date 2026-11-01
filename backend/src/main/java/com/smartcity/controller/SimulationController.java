package com.smartcity.controller;

import com.smartcity.dto.SimulationRequest;
import com.smartcity.dto.SimulationResultDto;
import com.smartcity.service.SimulationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/simulation")
public class SimulationController {

    private final SimulationService simulationService;

    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    @PostMapping("/run")
    public ResponseEntity<SimulationResultDto> runSimulation(@RequestBody SimulationRequest request) {
        SimulationResultDto result = simulationService.runSimulation(request);
        return ResponseEntity.ok(result);
    }
}
