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
}

