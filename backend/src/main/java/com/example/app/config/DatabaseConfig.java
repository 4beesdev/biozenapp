package com.example.app.config;

import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.util.Map;

@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        DataSourceBuilder<?> builder = DataSourceBuilder.create();
        
        // Digital Ocean setuje pojedinačne varijable za bazu
        // Proveri da li postoje HOSTNAME, PORT, DATABASE, USERNAME, PASSWORD
        String hostname = null;
        String port = null;
        String database = null;
        String username = null;
        String password = null;
        String databaseUrl = null;
        
        Map<String, String> env = System.getenv();
        
        // Prvo proveri da li postoje pojedinačne varijable (Digital Ocean format)
        for (String key : env.keySet()) {
            String value = env.get(key);
            
            // Preskoči placeholder stringove
            if (value != null && value.startsWith("${")) {
                continue;
            }
            
            // Traži HOSTNAME, PORT, DATABASE, USERNAME, PASSWORD sa prefiksom baze
            if (key.endsWith(".HOSTNAME") || key.equals("HOSTNAME") || key.endsWith("_HOSTNAME")) {
                hostname = value;
                System.out.println("Found HOSTNAME: " + key + " = " + hostname);
            } else if (key.endsWith(".PORT") || key.equals("PORT") || key.endsWith("_PORT")) {
                port = value;
                System.out.println("Found PORT: " + key + " = " + port);
            } else if (key.endsWith(".DATABASE") || key.equals("DATABASE") || key.endsWith("_DATABASE")) {
                database = value;
                System.out.println("Found DATABASE: " + key + " = " + database);
            } else if (key.endsWith(".USERNAME") || key.equals("USERNAME") || key.endsWith("_USERNAME")) {
                username = value;
                System.out.println("Found USERNAME: " + key + " = " + username);
            } else if (key.endsWith(".PASSWORD") || key.equals("PASSWORD") || key.endsWith("_PASSWORD")) {
                password = value;
                System.out.println("Found PASSWORD: " + key + " = [HIDDEN]");
            } else if ((key.endsWith(".DATABASE_URL") || key.equals("DATABASE_URL")) && !value.startsWith("${")) {
                databaseUrl = value;
                System.out.println("Found DATABASE_URL: " + key + " = " + (databaseUrl.length() > 50 ? databaseUrl.substring(0, 50) + "..." : databaseUrl));
            }
        }
        
        // Ako imamo sve pojedinačne varijable, konstruiši JDBC URL
        if (hostname != null && port != null && database != null && username != null && password != null) {
            String jdbcUrl = String.format("jdbc:postgresql://%s:%s/%s", hostname, port, database);
            System.out.println("Constructed JDBC URL from individual variables:");
            System.out.println("  JDBC URL: " + jdbcUrl);
            System.out.println("  Username: " + username);
            System.out.println("  Host: " + hostname);
            System.out.println("  Port: " + port);
            System.out.println("  Database: " + database);
            
            return builder
                .url(jdbcUrl)
                .username(username)
                .password(password)
                .driverClassName("org.postgresql.Driver")
                .build();
        }
        
        // Ako postoji DATABASE_URL (ne placeholder), parsiraj ga
        if (databaseUrl != null && !databaseUrl.isEmpty() && !databaseUrl.startsWith("${")) {
            try {
                // Format: postgresql://user:pass@host:port/dbname
                // Konvertuj u: jdbc:postgresql://host:port/dbname
                URI dbUri = new URI(databaseUrl.replace("postgresql://", "http://"));
                
                String dbUsername = null;
                String dbPassword = null;
                if (dbUri.getUserInfo() != null) {
                    String[] userInfo = dbUri.getUserInfo().split(":");
                    dbUsername = userInfo[0];
                    if (userInfo.length > 1) {
                        dbPassword = userInfo[1];
                    }
                }
                
                String host = dbUri.getHost();
                int dbPort = dbUri.getPort() == -1 ? 5432 : dbUri.getPort();
                String path = dbUri.getPath().replaceFirst("/", "");
                
                String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", host, dbPort, path);
                
                System.out.println("Parsed DATABASE_URL successfully:");
                System.out.println("  JDBC URL: " + jdbcUrl);
                System.out.println("  Username: " + dbUsername);
                System.out.println("  Host: " + host);
                System.out.println("  Port: " + dbPort);
                System.out.println("  Database: " + path);
                
                return builder
                    .url(jdbcUrl)
                    .username(dbUsername)
                    .password(dbPassword)
                    .driverClassName("org.postgresql.Driver")
                    .build();
            } catch (Exception e) {
                System.err.println("Error parsing DATABASE_URL: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        // Fallback na application.properties konfiguraciju
        System.out.println("No valid database configuration found, using application.properties");
        System.out.println("Available environment variables:");
        for (String key : env.keySet()) {
            if (key.contains("DATABASE") || key.contains("DB") || key.contains("POSTGRES")) {
                String value = env.get(key);
                System.out.println("  " + key + " = " + (value != null && value.length() > 50 ? value.substring(0, 50) + "..." : value));
            }
        }
        return builder.build();
    }
}
