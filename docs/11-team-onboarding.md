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

- **local:** PostgreSQL `localhost:5432`, Flyway V1–V6, `ddl-auto: validate` (IntelliJ / `mvn spring-boot:run`)
- **prod:** PostgreSQL trong Docker, cùng Flyway + validate
- **test:** H2 in-memory — chỉ `./mvnw test`, không cần Postgres

## Seed users

| User | Password | Role |
|------|----------|------|
| admin | admin123 | ADMIN |
| staff | staff123 | STAFF |
| warehouse | warehouse123 | WAREHOUSE |

## Dev without full Docker stack

Chạy Postgres trước (schema + seed):

```bash
docker compose -f docker/docker-compose.yaml up -d postgres
```

Backend (profile `local` mặc định):

```bash
cd backend && ./mvnw spring-boot:run
# hoặc IntelliJ: Active profiles = local, SmartMartApplication
```

Frontend & AI:

```bash
cd frontend && npm run dev   # VITE_API_URL=http://localhost:8080
cd ai-service && uvicorn app.main:app --reload --port 8000
```

**IntelliJ Database:** PostgreSQL, host `localhost`, port `5432`, DB `smartmart_db`, user/pass theo `docker/.env` hoặc `application-local.yml` defaults.

OpenAPI: `/v3/api-docs` hoặc `docs/openapi-v1.json`.
