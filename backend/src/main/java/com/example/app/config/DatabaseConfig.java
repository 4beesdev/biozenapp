package com.example.app.config;

import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.util.Map;

@Configuration
@Primary
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        DataSourceBuilder<?> builder = DataSourceBuilder.create();
        
        Map<String, String> env = System.getenv();
        
        System.out.println("=== Searching for Database Variables ===");
        
        // PRVO: Proveri standardne environment variables koje korisnik može ručno setovati
        String databaseUrl = env.get("DATABASE_URL");
        String springDatasourceUrl = env.get("SPRING_DATASOURCE_URL");
        String springDatasourceUsername = env.get("SPRING_DATASOURCE_USERNAME");
        String springDatasourcePassword = env.get("SPRING_DATASOURCE_PASSWORD");
        
        // Preskoči placeholder stringove
        if (databaseUrl != null && databaseUrl.startsWith("${")) {
            databaseUrl = null;
        }
        if (springDatasourceUrl != null && springDatasourceUrl.startsWith("${")) {
            springDatasourceUrl = null;
        }
        
        System.out.println("Standard variables:");
        System.out.println("  DATABASE_URL: " + (databaseUrl != null && !databaseUrl.startsWith("${") ? (databaseUrl.length() > 50 ? databaseUrl.substring(0, 50) + "..." : databaseUrl) : "null or placeholder"));
        System.out.println("  SPRING_DATASOURCE_URL: " + (springDatasourceUrl != null ? springDatasourceUrl : "null"));
        System.out.println("  SPRING_DATASOURCE_USERNAME: " + (springDatasourceUsername != null ? springDatasourceUsername : "null"));
        System.out.println("  SPRING_DATASOURCE_PASSWORD: " + (springDatasourcePassword != null ? "[HIDDEN]" : "null"));
        
        // Ako postoji SPRING_DATASOURCE_URL (već u JDBC formatu), koristi ga direktno
        if (springDatasourceUrl != null && !springDatasourceUrl.isEmpty()) {
            System.out.println("✓ Using SPRING_DATASOURCE_URL directly");
            return builder
                .url(springDatasourceUrl)
                .username(springDatasourceUsername != null ? springDatasourceUsername : "biozen")
                .password(springDatasourcePassword != null ? springDatasourcePassword : "")
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
                
                System.out.println("✓ Parsed DATABASE_URL successfully:");
                System.out.println("  JDBC URL: " + jdbcUrl);
                System.out.println("  Username: " + dbUsername);
                
                return builder
                    .url(jdbcUrl)
                    .username(dbUsername)
                    .password(dbPassword)
                    .driverClassName("org.postgresql.Driver")
                    .build();
            } catch (Exception e) {
                System.err.println("✗ Error parsing DATABASE_URL: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        // DRUGO: Traži varijable sa prefiksom baze (Digital Ocean automatski format)
        String dbPrefix = null;
        for (String key : env.keySet()) {
            String value = env.get(key);
            // Preskoči placeholder stringove
            if (value != null && value.startsWith("${")) {
                continue;
            }
            
            // Traži HOSTNAME, DATABASE, USERNAME sa prefiksom baze
            if ((key.contains(".HOSTNAME") || key.contains(".DATABASE") || key.contains(".USERNAME")) 
                && !key.equals("HOSTNAME") && !key.equals("DATABASE") && !key.equals("USERNAME")) {
                int dotIndex = key.lastIndexOf('.');
                if (dotIndex > 0) {
                    dbPrefix = key.substring(0, dotIndex);
                    System.out.println("Found database prefix: " + dbPrefix);
                    break;
                }
            }
        }
        
        String hostname = null;
        String port = null;
        String database = null;
        String username = null;
        String password = null;
        
        // Ako imamo prefiks, traži varijable sa tim prefiksom
        if (dbPrefix != null) {
            System.out.println("Looking for variables with prefix: " + dbPrefix);
            for (String key : env.keySet()) {
                String value = env.get(key);
                // Preskoči placeholder stringove
                if (value != null && value.startsWith("${")) {
                    continue;
                }
                
                if (key.equals(dbPrefix + ".HOSTNAME") || key.equals(dbPrefix + ".HOST")) {
                    hostname = value;
                    System.out.println("  Found HOSTNAME: " + hostname);
                } else if (key.equals(dbPrefix + ".PORT")) {
                    port = value;
                    System.out.println("  Found PORT: " + port);
                } else if (key.equals(dbPrefix + ".DATABASE") || key.equals(dbPrefix + ".DB_NAME")) {
                    database = value;
                    System.out.println("  Found DATABASE: " + database);
                } else if (key.equals(dbPrefix + ".USERNAME") || key.equals(dbPrefix + ".USER")) {
                    username = value;
                    System.out.println("  Found USERNAME: " + username);
                } else if (key.equals(dbPrefix + ".PASSWORD")) {
                    password = value;
                    System.out.println("  Found PASSWORD: [HIDDEN]");
                } else if (key.equals(dbPrefix + ".DATABASE_URL")) {
                    databaseUrl = value;
                    System.out.println("  Found DATABASE_URL: " + (databaseUrl.length() > 50 ? databaseUrl.substring(0, 50) + "..." : databaseUrl));
                }
            }
        }
        
        // Ako imamo sve pojedinačne varijable, konstruiši JDBC URL
        if (hostname != null && port != null && database != null && username != null && password != null) {
            String jdbcUrl = String.format("jdbc:postgresql://%s:%s/%s", hostname, port, database);
            System.out.println("✓ Constructed JDBC URL from individual variables:");
            System.out.println("  JDBC URL: " + jdbcUrl);
            System.out.println("  Username: " + username);
            
            return builder
                .url(jdbcUrl)
                .username(username)
                .password(password)
                .driverClassName("org.postgresql.Driver")
                .build();
        }
        
        // Fallback - koristi application.properties
        System.out.println("✗ No valid database configuration found, using application.properties");
        System.out.println("All environment variables containing 'db', 'database', or 'postgres':");
        for (String key : env.keySet()) {
            String lowerKey = key.toLowerCase();
            if (lowerKey.contains("db") || lowerKey.contains("database") || lowerKey.contains("postgres")) {
                String value = env.get(key);
                System.out.println("  " + key + " = " + (value != null && value.length() > 100 ? value.substring(0, 100) + "..." : value));
            }
        }
        return builder.build();
    }
}
