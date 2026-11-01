# ==============================================================================
# Multi-Stage Dockerfile for Smart City Waste Management Backend (Java 21)
# ==============================================================================

# Stage 1: Build the Spring Boot Application
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy Maven POM and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package application
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal Runtime Environment
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Install curl for container health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create directory for persistent uploads
RUN mkdir -p /app/uploads/reports && chmod -R 777 /app/uploads

# Copy compiled JAR from build stage
COPY --from=build /app/target/waste-management-system-1.0.0.jar app.jar

# Dynamic Port assigned by hosting provider (defaults to 8080)
ENV PORT=8080
EXPOSE ${PORT}

# Run Spring Boot
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-Dserver.port=${PORT}", "-jar", "app.jar"]
