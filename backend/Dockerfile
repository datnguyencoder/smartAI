# ==========================================
# STAGE 1: BUILD THE APPLICATION (MAVEN BUILDER)
# ==========================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Cache Maven dependencies by copying only the pom.xml first
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy all source files and package the application
COPY src ./src
RUN mvn package -DskipTests -B

# ==========================================
# STAGE 2: RUNTIME ENVIRONMENT
# ==========================================
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Healthcheck + optional debugging (wget for compose health probe)
RUN apk add --no-cache wget

# Create a non-root system user and group for maximum runtime security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the built jar file from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Spring Boot standard port
EXPOSE 8080

# Environment variables with sensible defaults for containerized execution
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-XX:+UseG1GC -XX:+UseStringDeduplication -Xmx1024m"

# Execute the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
