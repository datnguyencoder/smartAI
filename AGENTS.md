# SmartMart AI — Agent lanes

Use **Cursor Rules** (`.cursor/rules/`) so each session stays in one lane. Rules apply automatically when you open matching files, or always for monorepo overview.

## Quick start

| You are working on… | Open / mention | Rule file |
|---------------------|----------------|-----------|
| React UI | `frontend/**` | `frontend-agent.mdc` |
| Spring Boot | `backend/**` | `backend-agent.mdc` |
| FastAPI ML | `ai-service/**` | `ai-service-agent.mdc` |
| Cross-cutting / planning | any | `smartmart-monorepo.mdc` (always on) |

## Lane assignments

### FE agent

- **Path:** `frontend/`
- **Tasks:** pages, hooks, `services/api.ts`, auth client, map DTOs, replace mock state incrementally
- **Docs:** `frontend/react.MD`, `docs/04-api-specification.md` (consumer)

### BE agent

- **Path:** `backend/`
- **Tasks:** controllers, services, transactions, Flyway/Postgres, JWT auth API, WebClient → AI, Gemini insight APIs
- **Coding standard (bắt buộc):** [`docs/09-backend-coding-standards.md`](docs/09-backend-coding-standards.md) — `*Service` interface + `*ServiceImpl` trong `service/impl/`, AI trong `service/ai/`
- **Docs:** `docs/02-business-rule.md`, `docs/03-database-design.md`, `docs/04-api-specification.md`, `docs/07-testing-plan.md`

### AI agent

- **Path:** `ai-service/`
- **Tasks:** FastAPI app, `/ai/health`, train/forecast routers, `requirements.txt`, model files in `saved_models/`
- **Docs:** `docs/05-ai-forecasting.md`, `docs/04-api-specification.md` §2.14

## Parallel work (safe batches)

**Batch A (parallel):**

- BE: `AuthController` + login
- FE: login screen + token storage + axios interceptor
- AI: `app/main.py` + `GET /ai/health`

**Batch B (after A):**

- BE: `SalesOrder` / `PurchaseOrder` + stock movement
- FE: POS checkout → `POST` sales API
- AI: `/ai/train` stub

**Batch C:**

- BE: `ForecastController` + WebClient
- AI: `/ai/forecast/all`
- FE: forecast page uses API

## Prompt templates

**FE:**

```
Lane: FE only (frontend/). Task: <mô tả>. Contract: docs/04. Không sửa backend.
```

**BE:**

```
Lane: BE only (backend/). Task: <mô tả>. Bắt buộc docs/09-backend-coding-standards.md (DTO, ApiResponse, @Transactional, exception chuẩn). Không sửa frontend.
```

**AI:**

```
Lane: AI only (ai-service/). Task: <mô tả>. JSON API only. Không Gemini, không JPA.
```

## Git policy

- **Push / PR / merge remote:** chỉ khi bạn nói rõ trong tin nhắn hiện tại.
- Agent có thể `git status`, `diff`, `commit` local nếu bạn yêu cầu commit — không tự push.
- Cấu hình classifier: [`.cursor/permissions.json`](.cursor/permissions.json)

## Repo status (reference)

- **BE:** WMS APIs (`/api/v1` items, orders, purchase, inventory, scrap, users, dashboard, forecast, ai-insight); `InventoryLedgerService`; Flyway V1+V2
- **FE:** Login + POS (ảnh SKU, quét barcode Enter) + purchase + dashboard/forecast; `ProductThumbnail`, `wmsApi` (PUT item, barcode)
- **AI:** FastAPI `ai-service` — `/ai/health`, `/ai/train`, `/ai/forecast/all`, `/ai/model/metrics`

Update this section when integration milestones land.
