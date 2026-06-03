# SmartMart — Team onboarding & Docker (docs/11)

## Quick start

```bash
cd docker
cp .env.example .env
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8080 |
| Swagger | http://localhost:8080/swagger-ui/index.html |
| AI | http://localhost:8000/ai/health |

## Profiles

- **local:** H2, Flyway off, `ddl-auto: update`
- **prod:** PostgreSQL, Flyway `V1__wms_baseline.sql`, `ddl-auto: validate`

## Seed users

| User | Password | Role |
|------|----------|------|
| admin | admin123 | ADMIN |
| staff | staff123 | STAFF |
| warehouse | warehouse123 | WAREHOUSE |

## Dev without Docker

```bash
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local
cd frontend && npm run dev   # VITE_API_URL=http://localhost:8080
cd ai-service && uvicorn app.main:app --reload --port 8000
```

OpenAPI: `/v3/api-docs` hoặc `docs/openapi-v1.json`.
