package com.example.app.measurement;

import com.example.app.user.User;
import com.example.app.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/measurements")
public class MeasurementController {

    private final MeasurementRepository measurementRepository;
    private final UserRepository userRepository;

    public MeasurementController(MeasurementRepository measurementRepository, UserRepository userRepository) {
        this.measurementRepository = measurementRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Measurement>> getMeasurements(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String userIdStr = String.valueOf(auth.getPrincipal());
        Long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            return ResponseEntity.status(401).build();
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty() || userOpt.get().getIsActive() == null || !userOpt.get().getIsActive()) {
            return ResponseEntity.status(404).build();
        }

        List<Measurement> measurements = measurementRepository.findByUserIdOrderByDatumDesc(userId);
        return ResponseEntity.ok(measurements);
    }

    @PostMapping
    public ResponseEntity<?> createMeasurement(Authentication auth, @RequestBody CreateMeasurementRequest request) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Niste autentifikovani"));
        }

        String userIdStr = String.valueOf(auth.getPrincipal());
        Long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            return ResponseEntity.status(401).body(Map.of("message", "Neispravan token"));
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty() || userOpt.get().getIsActive() == null || !userOpt.get().getIsActive()) {
            return ResponseEntity.status(404).body(Map.of("message", "Korisnik nije pronađen ili je deaktiviran"));
        }

        // Proveri da li postoji prethodno merenje za izračunavanje promene
        List<Measurement> previousMeasurements = measurementRepository.findByUserIdOrderByDatumDesc(userId);
        Double promena = null;
        Double promenaObimStruka = null;
        if (!previousMeasurements.isEmpty()) {
            Measurement lastMeasurement = previousMeasurements.get(0);
            promena = request.kilaza - lastMeasurement.getKilaza();
            if (request.obimStruka != null && lastMeasurement.getObimStruka() != null) {
                promenaObimStruka = request.obimStruka - lastMeasurement.getObimStruka();
            }
        }

        Measurement measurement = new Measurement();
        measurement.setUserId(userId);
        measurement.setDatum(request.datum != null ? LocalDate.parse(request.datum) : LocalDate.now());
        measurement.setKilaza(request.kilaza);
        measurement.setPromena(promena);
        measurement.setObimStruka(request.obimStruka);
        measurement.setPromenaObimStruka(promenaObimStruka);
        measurement.setKomentar(request.komentar);

        Measurement saved = measurementRepository.save(measurement);

        Map<String, Object> response = new HashMap<>();
        response.put("id", saved.getId());
        response.put("datum", saved.getDatum().toString());
        response.put("kilaza", saved.getKilaza());
        response.put("promena", saved.getPromena());
        response.put("obimStruka", saved.getObimStruka());
        response.put("promenaObimStruka", saved.getPromenaObimStruka());
        response.put("komentar", saved.getKomentar());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMeasurement(Authentication auth, @PathVariable Long id) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Niste autentifikovani"));
        }

        String userIdStr = String.valueOf(auth.getPrincipal());
        Long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            return ResponseEntity.status(401).body(Map.of("message", "Neispravan token"));
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty() || userOpt.get().getIsActive() == null || !userOpt.get().getIsActive()) {
            return ResponseEntity.status(404).body(Map.of("message", "Korisnik nije pronađen ili je deaktiviran"));
        }
        Optional<Measurement> measurementOpt = measurementRepository.findById(id);

        if (measurementOpt.isEmpty() || !measurementOpt.get().getUserId().equals(userId)) {
            return ResponseEntity.status(404).body(Map.of("message", "Merenje nije pronađeno"));
        }

        measurementRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Merenje je obrisano"));
    }

    public static class CreateMeasurementRequest {
        public String datum;
        public Double kilaza;
        public Double obimStruka;
        public String komentar;
    }
}

