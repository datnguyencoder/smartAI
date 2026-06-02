# SmartMart Backend (Spring Boot)

## Coding standards

All Java code **must** follow:

**[../docs/09-backend-coding-standards.md](../docs/09-backend-coding-standards.md)**

Cursor rule (auto when editing `backend/**`): `.cursor/rules/backend-agent.mdc`

## Quick reference

- API prefix: `/api/v1/`
- Response: `com.smartmart.common.response.ApiResponse`
- Layers: `controller` → `service`/`impl` → `repository` → `entity`
- New endpoints: use `dto/` — do not expose JPA entities

## Run locally

```bash
cd backend
./mvnw spring-boot:run
```

Swagger UI: `http://localhost:8080/swagger-ui.html`
