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
        
        Map<String, String> env = System.getenv();
        
        // Ispiši sve environment variables za debug
        System.out.println("=== All Environment Variables ===");
        for (String key : env.keySet()) {
            String value = env.get(key);
            // Ispiši samo one koje su relevantne za bazu ili koje počinju sa prefiksom baze
            if (key.contains("DATABASE") || key.contains("DB") || key.contains("POSTGRES") || 
                key.startsWith("dev-db-") || key.contains("HOSTNAME") || key.contains("USERNAME") || 
                key.contains("PASSWORD") || key.contains("PORT")) {
                System.out.println("  " + key + " = " + (value != null && value.length() > 100 ? value.substring(0, 100) + "..." : value));
            }
        }
        System.out.println("===================================");
        
        // Traži varijable sa prefiksom baze (npr. dev-db-229452.HOSTNAME)
        String dbPrefix = null;
        for (String key : env.keySet()) {
            if (key.contains(".HOSTNAME") || key.contains(".DATABASE") || key.contains(".USERNAME")) {
                int dotIndex = key.lastIndexOf('.');
                if (dotIndex > 0) {
                    dbPrefix = key.substring(0, dotIndex);
                    System.out.println("Found database prefix: " + dbPrefix);
                    break;
                }
            }
        }
        
        // Ako nema prefiksa, pokušaj da pronađeš po imenu baze iz app.yaml (dev-db-229452)
        if (dbPrefix == null) {
            for (String key : env.keySet()) {
                if (key.startsWith("dev-db-") && key.contains("DATABASE_URL")) {
                    int dotIndex = key.lastIndexOf('.');
                    if (dotIndex > 0) {
                        dbPrefix = key.substring(0, dotIndex);
                        System.out.println("Found database prefix from DATABASE_URL: " + dbPrefix);
                        break;
                    }
                }
            }
        }
        
        String hostname = null;
        String port = null;
        String database = null;
        String username = null;
        String password = null;
        String databaseUrl = null;
        
        // Ako imamo prefiks, traži varijable sa tim prefiksom
        if (dbPrefix != null) {
            hostname = env.get(dbPrefix + ".HOSTNAME");
            port = env.get(dbPrefix + ".PORT");
            database = env.get(dbPrefix + ".DATABASE");
            username = env.get(dbPrefix + ".USERNAME");
            password = env.get(dbPrefix + ".PASSWORD");
            databaseUrl = env.get(dbPrefix + ".DATABASE_URL");
            
            System.out.println("Looking for variables with prefix: " + dbPrefix);
            System.out.println("  HOSTNAME: " + (hostname != null ? hostname : "null"));
            System.out.println("  PORT: " + (port != null ? port : "null"));
            System.out.println("  DATABASE: " + (database != null ? database : "null"));
            System.out.println("  USERNAME: " + (username != null ? username : "null"));
            System.out.println("  PASSWORD: " + (password != null ? "[HIDDEN]" : "null"));
            System.out.println("  DATABASE_URL: " + (databaseUrl != null && !databaseUrl.startsWith("${") ? (databaseUrl.length() > 50 ? databaseUrl.substring(0, 50) + "..." : databaseUrl) : "null or placeholder"));
        }
        
        // Ako imamo sve pojedinačne varijable, konstruiši JDBC URL
        if (hostname != null && port != null && database != null && username != null && password != null) {
            String jdbcUrl = String.format("jdbc:postgresql://%s:%s/%s", hostname, port, database);
            System.out.println("Constructed JDBC URL from individual variables:");
            System.out.println("  JDBC URL: " + jdbcUrl);
            System.out.println("  Username: " + username);
            
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
        
        // Fallback - koristi application.properties
        System.out.println("No valid database configuration found, using application.properties");
        return builder.build();
    }
}
