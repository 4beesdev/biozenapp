package com.example.app.config;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    private final Environment environment;

    public DatabaseConfig(Environment environment) {
        this.environment = environment;
    }

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        DataSourceProperties properties = new DataSourceProperties();
        
        // Proveri sve moguće environment variable nazive koje Digital Ocean može setovati
        String databaseUrl = null;
        
        // Prvo proveri standardni DATABASE_URL
        databaseUrl = environment.getProperty("DATABASE_URL");
        
        // Ako ne postoji, proveri da li postoji sa prefiksom baze (npr. dev-db-229452.DATABASE_URL)
        if (databaseUrl == null || databaseUrl.isEmpty()) {
            // Digital Ocean setuje sa prefiksom imena baze
            // Traži sve environment variables koje se završavaju sa .DATABASE_URL
            for (String key : System.getenv().keySet()) {
                if (key.endsWith(".DATABASE_URL")) {
                    databaseUrl = System.getenv(key);
                    System.out.println("Found DATABASE_URL with prefix: " + key);
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
                
                properties.setUrl(jdbcUrl);
                if (dbUsername != null) {
                    properties.setUsername(dbUsername);
                }
                if (dbPassword != null) {
                    properties.setPassword(dbPassword);
                }
                
                System.out.println("Parsed DATABASE_URL successfully");
            } catch (Exception e) {
                System.err.println("Error parsing DATABASE_URL: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        return properties;
    }

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().build();
    }
}


