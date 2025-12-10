package com.example.app.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromEmail;

    public EmailService(@org.springframework.beans.factory.annotation.Autowired(required = false) JavaMailSender mailSender,
                       @Value("${app.mail.from:no-reply@biozen.rs}") String fromEmail) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
    }

    public boolean sendPasswordResetEmail(String toEmail, String resetToken, String resetUrl) {
        if (mailSender == null) {
            System.err.println("WARNING: JavaMailSender is not available. Email cannot be sent.");
            System.err.println("Reset token for " + toEmail + ": " + resetToken);
            System.err.println("Reset URL: " + resetUrl);
            return false;
        }
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("BioZen Tracker - Reset lozinke");
            message.setText(
                "Poštovani,\n\n" +
                "Primili ste ovaj email jer ste zatražili reset lozinke za vaš BioZen Tracker nalog.\n\n" +
                "Kliknite na sledeći link da resetujete lozinku:\n" +
                resetUrl + "\n\n" +
                "Link je važeći 1 sat.\n\n" +
                "Ako niste zatražili reset lozinke, ignorišite ovaj email.\n\n" +
                "Srdačan pozdrav,\n" +
                "BioZen Tracker tim"
            );
            mailSender.send(message);
            System.out.println("Email sent successfully to: " + toEmail);
            return true;
        } catch (Exception e) {
            // Log error but don't throw - we don't want to expose email errors to users
            System.err.println("Error sending password reset email: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public boolean sendWelcomeEmail(String toEmail, String frontendUrl) {
        if (mailSender == null) {
            System.err.println("WARNING: JavaMailSender is not available. Welcome email cannot be sent.");
            System.err.println("Welcome email for: " + toEmail);
            return false;
        }
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Dobrodošli u BioZen Tracker!");
            message.setText(
                "Poštovani,\n\n" +
                "Dobrodošli u BioZen Tracker - vašu aplikaciju za praćenje kilaže i zdravog načina života!\n\n" +
                "Vaš nalog je uspešno kreiran. Sada možete:\n\n" +
                "• Uneti svoje podatke (ime, prezime, pol, starost, kilaža, željena kilaža)\n" +
                "• Pratiti svoju kilažu kroz vreme\n" +
                "• Videti grafički prikaz svojih napredaka\n" +
                "• Dobiti savete za skidanje kilograma\n\n" +
                "Pristupite aplikaciji ovde:\n" +
                frontendUrl + "\n\n" +
                "Ako imate pitanja ili vam je potrebna pomoć, slobodno nas kontaktirajte.\n\n" +
                "Želimo vam puno uspeha u postizanju vaših ciljeva!\n\n" +
                "Srdačan pozdrav,\n" +
                "BioZen Tracker tim"
            );
            mailSender.send(message);
            System.out.println("Welcome email sent successfully to: " + toEmail);
            return true;
        } catch (Exception e) {
            // Log error but don't throw - we don't want to expose email errors to users
            System.err.println("Error sending welcome email: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}

