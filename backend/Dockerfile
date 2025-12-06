# Backend Dockerfile - Spring Boot
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Kopiraj pom.xml i preuzmi dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Kopiraj source kod i build
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Kopiraj JAR fajl
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run aplikaciju sa boljim error handling
ENTRYPOINT ["sh", "-c", "java -Djava.security.egd=file:/dev/./urandom -jar app.jar"]

