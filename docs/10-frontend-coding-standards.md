# SmartMart — Frontend coding standards (docs/10)

## Stack

- React 18 + Vite + TypeScript + Ant Design + Tailwind
- API: `import.meta.env.VITE_API_URL` (default `http://localhost:8080`)

## API client

- `frontend/src/services/apiClient.ts` — `fetch`, header `Authorization: Bearer <token>`
- Envelope: `{ success, message, data, errorCode?, errors? }`
- Lỗi: `ApiClientError` với `errorCode`

## Auth

- `POST /api/v1/auth/login` → `localStorage` token + user
- 401 → logout, màn login

## Mapping WMS → UI

| UI | API |
|----|-----|
| Sản phẩm | `GET /api/v1/items` (`totalAvailableQty`) |
| POS | `POST /api/v1/orders` |
| Hóa đơn | `GET /api/v1/orders` |
| Nhập | `POST/GET /api/v1/purchase-orders`, `POST .../receive` |
| Tồn | `GET /api/v1/inventory` |

Không trừ tồn local — refresh sau mỗi giao dịch.
