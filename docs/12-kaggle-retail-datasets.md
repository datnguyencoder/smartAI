# 12. Dataset siêu thị (Kaggle & nguồn mở) cho AI SmartMart

Tài liệu research + cách lấy thêm dữ liệu bán lẻ phục vụ huấn luyện/dự báo (`POST /api/v1/forecast/train`).

---

## 1. Tóm tắt trong repo

| Trạng thái | Chi tiết |
|------------|----------|
| Dataset tĩnh gốc Kaggle trong git | **Không** (bản quyền + kích thước) |
| UCI Online Retail đã tải & xử lý | **Có** — script + CSV seed 8 SKU / 180 ngày |
| Import vào DB | `RetailSalesHistorySeeder` → `orders` mã `RETAIL-*` |
| Train AI | BE aggregate 180 ngày từ DB → `POST /ai/train` |

Chi tiết vận hành: [`ai-service/datasets/README.md`](../ai-service/datasets/README.md).

---

## 2. Kaggle — dataset siêu thị phổ biến

### 2.1 Store Sales - Time Series Forecasting (khuyến nghị cho time-series)

| | |
|--|--|
| **Host** | Corporación Favorita (Ecuador) |
| **URL** | https://www.kaggle.com/competitions/store-sales-time-series-forecasting |
| **Quy mô** | Hàng nghìn chuỗi (cửa hàng × họ sản phẩm), 2013–2017 |
| **Cột chính** | `date`, `store_nbr`, `family`, `sales`, `onpromotion` |
| **File kèm** | `stores.csv`, `oil.csv`, `holidays_events.csv`, `transactions.csv` |
| **Phù hợp SmartMart** | **Rất cao** — bán theo ngày, mùa vụ, khuyến mãi; map `family` → `items`, `sales` → `order_items.quantity` |

**Hạn chế:** phải đăng nhập Kaggle, accept rules; `train.csv` lớn (~300MB+). Dùng `prepare_favorita_daily.py` lọc 1 store + top N họ hàng + 180 ngày.

### 2.2 Online Retail (UCI mirror trên Kaggle)

| | |
|--|--|
| **URL** | https://www.kaggle.com/datasets/mathchi/online-retail-data-set-from-ml-repository |
| **Nguồn gốc** | UCI [Online Retail](https://archive.ics.uci.edu/dataset/352/online+retail) |
| **Quy mô** | ~541k dòng giao dịch, UK, 2010–2011 |
| **Cột** | `InvoiceNo`, `StockCode`, `Quantity`, `InvoiceDate`, … |
| **Đã dùng trong repo** | Mirror CSV từ GitHub Databricks → `prepare_uci_daily.py` |

### 2.3 Dataset Kaggle khác (tham khảo)

| Dataset | URL / từ khóa | Ghi chú |
|---------|----------------|---------|
| Supermarket Sales | `supermarket-sales` | 1 file, ~1000 dòng — demo nhỏ |
| Retail Sales Forecasting | `retail-sales-dataset` | Nhiều bản aggregate sẵn |
| Grocery / FMCG | `grocery`, `fmcg sales` | Thường cần làm sạch trước khi map WMS |

---

## 3. Ánh xạ sang schema SmartMart AI

### 3.1 FastAPI train (`SalesHistoryRecord`)

| Trường AI | Nguồn UCI | Nguồn Favorita |
|-----------|-----------|----------------|
| `item_id` | `items.id` sau map `StockCode` → `RETAIL-{code}` | Map `family` → item |
| `sale_date` | `InvoiceDate` (ngày) | `date` |
| `quantity` | Sum `Quantity` theo ngày | `sales` |
| `category_id` | `categories.id` | Từ `family` hoặc nhóm cố định |

### 3.2 PostgreSQL (BE extract)

```sql
-- OrderRepository.aggregateDailySalesSince
SELECT item_id, DATE(order_date), SUM(quantity), MAX(category_id)
FROM orders o JOIN order_items oi ...
WHERE status = 'COMPLETED' AND order_date >= :since
GROUP BY item_id, DATE(order_date)
```

Đơn import: `order_code` = `RETAIL-YYYY-MM-DD`, `status` = `COMPLETED`, **không** trừ tồn kho.

---

## 4. Ngưỡng chất lượng (ai-service)

| Ngưỡng | Giá trị | Ý nghĩa |
|--------|---------|---------|
| `sales_history` tối thiểu | 1 dòng | API train |
| `MIN_ML_HISTORY_DAYS` | 30 ngày/item | Dưới ngưỡng → Moving Average |
| Cửa sổ BE train | 180 ngày | `ForecastOrchestrationService` |
| Cửa sổ forecast | 30 ngày | `buildForecastPayload` |

Với seed UCI 8 SKU × 180 ngày, mỗi SKU đủ điều kiện thử RF/XGBoost sau khi restart BE (`local`/`prod`).

---

## 5. Cấu hình seed

```yaml
# application.yml
app:
  seed:
    retail-sales:
      enabled: true
      csv: data/retail/uci_online_retail_daily.csv
```

Tắt: `SEED_RETAIL_SALES=false`.

---

## 6. Giấy phép & attribution

- **UCI Online Retail:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — ghi nguồn UCI khi publish báo cáo.
- **Kaggle Favorita:** điều khoản competition — chỉ dùng nội bộ học tập/demo trừ khi host cho phép thương mại.

---

## 7. Việc làm tiếp (tùy chọn)

1. Tải `train.csv` Favorita → `prepare_favorita_daily.py` → đổi CSV seed.
2. Bổ sung `is_holiday` từ `holidays_events.csv` vào `preprocess.py` (đã có cột trong docs/05).
3. Sửa `buildForecastPayload` + map response `forecasts` ↔ BE (tích hợp forecast run).
