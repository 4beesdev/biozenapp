package com.example.app.auth;

import com.example.app.config.JwtService;
import com.example.app.service.EmailService;
import com.example.app.user.User;
import com.example.app.user.UserRepository;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    // DTO klase umesto record-a
    public static class RegisterReq {
        @Email
        public String email;
        @NotBlank
        public String password;
    }

    public static class LoginReq {
        @Email
        public String email;
        @NotBlank
        public String password;
    }

    public static class AuthRes {
        public String token;
        public String email;
        public AuthRes(String token, String email) {
            this.token = token;
            this.email = email;
        }
    }

    public static class ForgotPasswordReq {
        @Email
        public String email;
    }

    public static class ResetPasswordReq {
        @NotBlank
        public String token;
        @NotBlank
        public String newPassword;
    }

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final EmailService emailService;
    private final String frontendUrl;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt, 
                         EmailService emailService,
                         @Value("${app.frontend.url:https://dev.biozen.rs}") String frontendUrl) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.emailService = emailService;
        this.frontendUrl = frontendUrl;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterReq req) {
        if (req == null || req.email == null || req.password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nedostaju email ili lozinka"));
        }
        if (users.existsByEmail(req.email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email već postoji"));
        }

        User u = new User();
        u.setEmail(req.email);
        u.setPasswordHash(encoder.encode(req.password));
        users.save(u);

        String token = jwt.generate(u.getEmail(), Map.of("uid", u.getId()));
        return ResponseEntity.ok(new AuthRes(token, u.getEmail()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginReq req) {
        if (req == null || req.email == null || req.password == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Neispravan email ili lozinka"));
        }

        Optional<User> userOpt = users.findByEmail(req.email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Neispravan email ili lozinka"));
        }

        User u = userOpt.get();
        if (!encoder.matches(req.password, u.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("message", "Neispravan email ili lozinka"));
        }

        String token = jwt.generate(u.getEmail(), Map.of("uid", u.getId()));
        return ResponseEntity.ok(new AuthRes(token, u.getEmail()));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordReq req) {
        if (req == null || req.email == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email je obavezan"));
        }

        Optional<User> userOpt = users.findByEmail(req.email);
        // Ne otkrivamo da li email postoji ili ne (security best practice)
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Generiši reset token
            String resetToken = UUID.randomUUID().toString();
            user.setPasswordResetToken(resetToken);
            user.setPasswordResetTokenExpiry(Instant.now().plusSeconds(3600)); // 1 sat
            
            try {
                users.save(user);
                
                // Pošalji email
                String resetUrl = frontendUrl + "/reset-password?token=" + resetToken;
                boolean emailSent = emailService.sendPasswordResetEmail(user.getEmail(), resetToken, resetUrl);
                
                if (emailSent) {
                    // Email je uspešno poslat
                    return ResponseEntity.ok(Map.of("message", "Link za reset lozinke je poslat na vašu email adresu. Proverite inbox i spam folder."));
                } else {
                    // Email nije poslat (greška u slanju)
                    return ResponseEntity.status(500).body(Map.of("message", "Greška pri slanju emaila. Molimo pokušajte ponovo kasnije."));
                }
            } catch (Exception e) {
                System.err.println("Error processing password reset: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.status(500).body(Map.of("message", "Greška pri obradi zahteva. Molimo pokušajte ponovo."));
            }
        }
        
        // Ako email ne postoji, vraćamo generičku poruku (security best practice)
        return ResponseEntity.ok(Map.of("message", "Ako email postoji, poslat će se link za reset lozinke na vašu email adresu."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordReq req) {
        if (req == null || req.token == null || req.newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token i nova lozinka su obavezni"));
        }

        if (req.newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Lozinka mora imati najmanje 6 karaktera"));
        }

        Optional<User> userOpt = users.findByPasswordResetToken(req.token);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Neispravan ili istekao token"));
        }

        User user = userOpt.get();
        
        // Proveri da li je token istekao
        if (user.getPasswordResetTokenExpiry() == null || 
            user.getPasswordResetTokenExpiry().isBefore(Instant.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token je istekao"));
        }

        // Resetuj lozinku
        user.setPasswordHash(encoder.encode(req.newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiry(null);
        users.save(user);

        return ResponseEntity.ok(Map.of("message", "Lozinka je uspešno resetovana"));
    }
}

