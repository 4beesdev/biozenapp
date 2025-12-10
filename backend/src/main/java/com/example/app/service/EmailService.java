package com.example.app.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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

    public boolean sendPasswordResetEmail(String toEmail, String resetToken, String resetUrl, String frontendUrl) {
        if (mailSender == null) {
            System.err.println("WARNING: JavaMailSender is not available. Email cannot be sent.");
            System.err.println("Reset token for " + toEmail + ": " + resetToken);
            System.err.println("Reset URL: " + resetUrl);
            return false;
        }
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail, "BioZen Tracker");
            helper.setTo(toEmail);
            helper.setSubject("BioZen Tracker - Reset lozinke");
            
            String htmlContent = buildEmailTemplate(
                "Reset lozinke",
                "Poštovani,<br><br>" +
                "Primili ste ovaj email jer ste zatražili reset lozinke za vaš BioZen Tracker nalog.<br><br>" +
                "<div style=\"text-align: center; margin: 30px 0;\">" +
                "<a href=\"" + resetUrl + "\" style=\"display: inline-block; background: linear-gradient(135deg, #416539 0%, #6b8e4f 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;\">Resetuj lozinku</a>" +
                "</div>" +
                "<p style=\"color: #6b6b6b; font-size: 14px; text-align: center;\">Ili kopirajte i nalepite ovaj link u vaš browser:<br>" +
                "<a href=\"" + resetUrl + "\" style=\"color: #416539; word-break: break-all;\">" + resetUrl + "</a></p>" +
                "<p style=\"color: #6b6b6b; font-size: 13px; margin-top: 20px;\">Link je važeći 1 sat.</p>" +
                "<p style=\"color: #6b6b6b; font-size: 13px;\">Ako niste zatražili reset lozinke, ignorišite ovaj email.</p>",
                frontendUrl
            );
            
            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("Email sent successfully to: " + toEmail);
            return true;
        } catch (MessagingException e) {
            System.err.println("Error sending password reset email: " + e.getMessage());
            e.printStackTrace();
            return false;
        } catch (Exception e) {
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
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail, "BioZen Tracker");
            helper.setTo(toEmail);
            helper.setSubject("Dobrodošli u BioZen Tracker!");
            
            String htmlContent = buildEmailTemplate(
                "Dobrodošli!",
                "Poštovani,<br><br>" +
                "Dobrodošli u <strong>BioZen Tracker</strong> - vašu aplikaciju za praćenje kilaže i zdravog načina života!<br><br>" +
                "Vaš nalog je uspešno kreiran. Sada možete:<br><br>" +
                "<ul style=\"color: #2d2d2d; line-height: 1.8; padding-left: 20px;\">" +
                "<li>Uneti svoje podatke (ime, prezime, pol, starost, kilaža, željena kilaža)</li>" +
                "<li>Pratiti svoju kilažu kroz vreme</li>" +
                "<li>Videti grafički prikaz svojih napredaka</li>" +
                "<li>Dobiti savete za skidanje kilograma</li>" +
                "</ul><br>" +
                "<div style=\"text-align: center; margin: 30px 0;\">" +
                "<a href=\"" + frontendUrl + "\" style=\"display: inline-block; background: linear-gradient(135deg, #416539 0%, #6b8e4f 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;\">Pristupite aplikaciji</a>" +
                "</div>" +
                "<p style=\"color: #6b6b6b; font-size: 14px;\">Ako imate pitanja ili vam je potrebna pomoć, slobodno nas kontaktirajte.</p>" +
                "<p style=\"color: #2d2d2d; font-size: 15px; font-weight: 600; margin-top: 20px;\">Želimo vam puno uspeha u postizanju vaših ciljeva!</p>",
                frontendUrl
            );
            
            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("Welcome email sent successfully to: " + toEmail);
            return true;
        } catch (MessagingException e) {
            System.err.println("Error sending welcome email: " + e.getMessage());
            e.printStackTrace();
            return false;
        } catch (Exception e) {
            System.err.println("Error sending welcome email: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    private String buildEmailTemplate(String title, String content, String frontendUrl) {
        return "<!DOCTYPE html>" +
                "<html lang=\"sr\">" +
                "<head>" +
                "<meta charset=\"UTF-8\">" +
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "</head>" +
                "<body style=\"margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f0; line-height: 1.6;\">" +
                "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #f5f5f0; padding: 40px 20px;\">" +
                "<tr>" +
                "<td align=\"center\">" +
                "<table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;\">" +
                // Header
                "<tr>" +
                "<td style=\"background: linear-gradient(135deg, #416539 0%, #6b8e4f 100%); padding: 30px; text-align: center;\">" +
                "<h1 style=\"margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;\">BioZen Tracker</h1>" +
                "</td>" +
                "</tr>" +
                // Content
                "<tr>" +
                "<td style=\"padding: 40px 30px;\">" +
                "<h2 style=\"margin: 0 0 20px 0; color: #2d2d2d; font-size: 24px; font-weight: 600;\">" + title + "</h2>" +
                "<div style=\"color: #2d2d2d; font-size: 15px;\">" + content + "</div>" +
                "</td>" +
                "</tr>" +
                // Footer
                "<tr>" +
                "<td style=\"background-color: #f5f5f0; padding: 30px; text-align: center; border-top: 1px solid #d4d4c4;\">" +
                "<img src=\"" + frontendUrl + "/logo.svg\" alt=\"BioZen Logo\" style=\"height: 40px; margin-bottom: 15px;\" />" +
                "<p style=\"margin: 10px 0 5px 0; color: #6b6b6b; font-size: 13px;\">BioZen Tracker</p>" +
                "<p style=\"margin: 5px 0; color: #6b6b6b; font-size: 12px;\">Aplikacija za praćenje kilaže i zdravog načina života</p>" +
                "<p style=\"margin: 15px 0 0 0; color: #6b6b6b; font-size: 11px;\">" +
                "<a href=\"" + frontendUrl + "\" style=\"color: #416539; text-decoration: none;\">" + frontendUrl + "</a>" +
                "</p>" +
                "</td>" +
                "</tr>" +
                "</table>" +
                "</td>" +
                "</tr>" +
                "</table>" +
                "</body>" +
                "</html>";
    }
}

