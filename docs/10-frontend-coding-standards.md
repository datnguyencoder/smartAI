# SmartMart — Frontend coding standards (docs/10)

## Stack

- React 18 + Vite + TypeScript + Ant Design + Tailwind
- API: `import.meta.env.VITE_API_URL` (default `http://localhost:8080`)
- Path alias: `@/` → `frontend/src/` (vite + tsconfig)

## Cấu trúc thư mục (`frontend/src/`)

```
src/
├── app/                    # Shell ứng dụng
│   ├── App.tsx             # Auth gate, catalog state, compose layout
│   ├── config/             # navItems, pageTitles
│   └── layout/             # Sidebar, Topbar, PageRenderer, …
├── pages/                  # Màn hình theo domain
│   ├── dashboard/
│   ├── catalog/            # products, categories, suppliers, locations
│   ├── inventory/          # tồn kho, kiểm kê, scrap
│   ├── sales/              # POS, hóa đơn, khách hàng
│   ├── purchase/           # phiếu nhập
│   ├── promotions/
│   ├── ai/                 # forecast, assistant, gợi ý
│   ├── operations/         # ca làm việc
│   ├── reports/
│   └── admin/              # users, settings, audit
├── components/             # UI tái sử dụng
│   ├── ui/                 # Card, UiButton, StatusChip
│   ├── auth/
│   ├── catalog/
│   ├── sales/
│   ├── ai/
│   └── common/
├── contexts/               # Auth, Theme
├── services/               # apiClient, wmsApi
├── lib/                    # utils, permissions, mappers, animations
└── types/                  # api DTOs, PageKey
```

**Quy ước import:** dùng `@/` thay vì relative path dài, ví dụ `import { Card } from '@/components/ui'`.

**Thêm trang mới:** tạo file trong `pages/<domain>/`, đăng ký route trong `app/layout/PageRenderer.tsx` và `app/config/navItems.ts`.

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
