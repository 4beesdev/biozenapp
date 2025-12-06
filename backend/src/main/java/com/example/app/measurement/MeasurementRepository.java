package com.example.app.measurement;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MeasurementRepository extends JpaRepository<Measurement, Long> {
    List<Measurement> findByUserIdOrderByDatumDesc(Long userId);
}

