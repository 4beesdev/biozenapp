package com.example.app.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String passwordHash;

    private Instant createdAt = Instant.now();

    // Dodatna polja za korisničke podatke
    private String ime;
    private String prezime;
    private String pol; // M, Ž, ili drugo
    private Integer starost;
    private Double kilaza; // trenutna kilaža
    private Double zeljenaKilaza; // željena kilaža

    // Password reset fields
    private String passwordResetToken;
    private Instant passwordResetTokenExpiry;

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public Instant getCreatedAt() { return createdAt; }
    public String getIme() { return ime; }
    public String getPrezime() { return prezime; }
    public String getPol() { return pol; }
    public Integer getStarost() { return starost; }
    public Double getKilaza() { return kilaza; }
    public Double getZeljenaKilaza() { return zeljenaKilaza; }

    public void setId(Long id) { this.id = id; }
    public void setEmail(String email) { this.email = email; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setIme(String ime) { this.ime = ime; }
    public void setPrezime(String prezime) { this.prezime = prezime; }
    public void setPol(String pol) { this.pol = pol; }
    public void setStarost(Integer starost) { this.starost = starost; }
    public void setKilaza(Double kilaza) { this.kilaza = kilaza; }
    public void setZeljenaKilaza(Double zeljenaKilaza) { this.zeljenaKilaza = zeljenaKilaza; }
    public String getPasswordResetToken() { return passwordResetToken; }
    public void setPasswordResetToken(String passwordResetToken) { this.passwordResetToken = passwordResetToken; }
    public Instant getPasswordResetTokenExpiry() { return passwordResetTokenExpiry; }
    public void setPasswordResetTokenExpiry(Instant passwordResetTokenExpiry) { this.passwordResetTokenExpiry = passwordResetTokenExpiry; }
}
