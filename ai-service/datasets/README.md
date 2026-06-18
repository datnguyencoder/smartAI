# Retail datasets for SmartMart AI

## Đã tích hợp sẵn (UCI Online Retail)

| File | Mô tả |
|------|--------|
| `raw/online-retail-dataset.csv` | Mirror UCI (~541k dòng) — **gitignore**, tải bằng script |
| `raw/online-retail-sample.csv` | IBM sample (~3k dòng) |
| `processed/uci_online_retail_daily.csv` | Gom theo ngày + SKU (sinh bởi script) |
| `../backend/.../uci_online_retail_daily.csv` | 8 SKU × 180 ngày → import vào `orders` khi BE khởi động |

Nguồn gốc: [UCI Online Retail](https://archive.ics.uci.edu/dataset/352/online+retail) (CC BY 4.0). Mirror: [Databricks Spark Guide CSV](https://github.com/databricks/Spark-The-Definitive-Guide/tree/master/data/retail-data/all).

### Tải & chuẩn bị một lệnh

```bash
# Cần pandas (ai-service/.venv hoặc pip install pandas)
python3 scripts/retail/download_retail_dataset.py --top-products 50 --last-days 365
```

Script tải raw từ mirror Databricks (~541k dòng), gom daily, ghi vào `backend/.../uci_online_retail_daily.csv`.

### Chuẩn bị lại thủ công

```bash
# Tải raw (nếu chưa có)
curl -fsSL -o ai-service/datasets/raw/online-retail-dataset.csv \
  "https://raw.githubusercontent.com/databricks/Spark-The-Definitive-Guide/master/data/retail-data/all/online-retail-dataset.csv"

# Gom daily + subset cho BE
ai-service/.venv/bin/python scripts/retail/prepare_uci_daily.py --top-products 8 --last-days 180
```

## Kaggle — Store Sales (Favorita)

| Dataset | Link | Ghi chú |
|---------|------|---------|
| **Store Sales - Time Series Forecasting** | https://www.kaggle.com/competitions/store-sales-time-series-forecasting | Siêu thị Ecuador, `train.csv` ~3M dòng |
| **Online Retail (mirror)** | https://www.kaggle.com/datasets/mathchi/online-retail-data-set-from-ml-repository | Cùng nguồn UCI |

Cần chấp nhận điều khoản competition, tải `train.csv`, đặt tại `ai-service/datasets/raw/favorita/train.csv`, rồi:

```bash
ai-service/.venv/bin/python scripts/retail/prepare_favorita_daily.py \
  --input ai-service/datasets/raw/favorita/train.csv --store 1 --top-families 8 --last-days 180
```

Đổi `app.seed.retail-sales.csv` trong `application.yml` sang `data/retail/favorita_store1_daily.csv` nếu muốn seed Favorita thay UCI.

### Kaggle CLI (tùy chọn)

```bash
pip install kaggle
# ~/.kaggle/kaggle.json
kaggle competitions download -c store-sales-time-series-forecasting -p ai-service/datasets/raw/favorita
unzip ai-service/datasets/raw/favorita/*.zip -d ai-service/datasets/raw/favorita
```

## Schema gửi FastAPI (`POST /ai/train`)

```json
{
  "sales_history": [
    { "item_id": 1, "sale_date": "2011-07-01", "quantity": 12.0, "category_id": 1 }
  ]
}
```

BE trích từ `orders` + `order_items` (`COMPLETED`), không đọc file CSV trực tiếp khi train.
