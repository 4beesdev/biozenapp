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
        
        // Proveri sve environment variables da pronađeš DATABASE_URL
        // Digital Ocean setuje sa prefiksom imena baze (npr. dev-db-229452.DATABASE_URL)
        String databaseUrl = null;
        
        // Prvo proveri standardni DATABASE_URL
        databaseUrl = System.getenv("DATABASE_URL");
        
        // Ako ne postoji, proveri sve environment variables koje se završavaju sa .DATABASE_URL
        if (databaseUrl == null || databaseUrl.isEmpty()) {
            Map<String, String> env = System.getenv();
            for (String key : env.keySet()) {
                if (key.endsWith(".DATABASE_URL") || key.equals("DATABASE_URL")) {
                    databaseUrl = env.get(key);
                    System.out.println("Found DATABASE_URL: " + key + " = " + (databaseUrl != null ? databaseUrl.substring(0, Math.min(50, databaseUrl.length())) + "..." : "null"));
                    break;
                }
            }
        }
        
        // Ako postoji DATABASE_URL, parsiraj ga
        if (databaseUrl != null && !databaseUrl.isEmpty()) {
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
                int port = dbUri.getPort() == -1 ? 5432 : dbUri.getPort();
                String path = dbUri.getPath().replaceFirst("/", "");
                
                String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", host, port, path);
                
                System.out.println("Parsed DATABASE_URL successfully:");
                System.out.println("  JDBC URL: " + jdbcUrl);
                System.out.println("  Username: " + dbUsername);
                System.out.println("  Host: " + host);
                System.out.println("  Port: " + port);
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
        // Spring Boot će automatski koristiti spring.datasource.* properties
        System.out.println("No DATABASE_URL found, using application.properties configuration");
        return builder.build();
    }
}
