package com.example.app.measurement;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "measurements")
public class Measurement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDate datum;

    @Column(nullable = false)
    private Double kilaza;

    private Double promena; // promena u odnosu na prethodno merenje

    @Column(length = 1000)
    private String komentar;

    public Measurement() {}

    public Measurement(Long userId, LocalDate datum, Double kilaza, String komentar) {
        this.userId = userId;
        this.datum = datum;
        this.kilaza = kilaza;
        this.komentar = komentar;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public LocalDate getDatum() { return datum; }
    public Double getKilaza() { return kilaza; }
    public Double getPromena() { return promena; }
    public String getKomentar() { return komentar; }

    public void setId(Long id) { this.id = id; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setDatum(LocalDate datum) { this.datum = datum; }
    public void setKilaza(Double kilaza) { this.kilaza = kilaza; }
    public void setPromena(Double promena) { this.promena = promena; }
    public void setKomentar(String komentar) { this.komentar = komentar; }
}

