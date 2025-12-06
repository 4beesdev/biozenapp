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

# Run aplikaciju
ENTRYPOINT ["java", "-jar", "app.jar"]

