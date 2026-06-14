# Tổng kết Benchmark — Bài báo Nghiên cứu SmartMart AI

**Ngày chạy:** 2026-06-14 16:00
**Script:** `ai-service/benchmark_runner.py`
**Output thô:** `ai-service/benchmark_results.txt`
**Cross-country:** `ai-service/TONG_KET_BENCHMARK_QUOC_TE.md`

---

## 1. Mục tiêu benchmark

| RQ | Nội dung | Bảng kết quả |
|----|----------|--------------|
| RQ1 | Độ chính xác dự báo (RF vs XGBoost vs MA) | TABLE I |
| RQ2 | Đặc trưng lịch Việt Nam có cải thiện MAPE? | TABLE II |
| RQ3 | LLM giải thích có dễ hiểu / hữu ích? | TABLE III |

---

## 2. Dataset thực nghiệm

| Thông số | Giá trị |
|----------|---------|
| File | `backend/src/main/resources/data/retail/vn_synthetic_daily.csv` |
| Số dòng | 18250 |
| SKU | 50 |
| Danh mục | 7 (Sữa, Đồ uống, Đồ ăn vặt, Hóa mỹ phẩm, Thực phẩm đóng gói, Đồ gia dụng, Đồ dùng cá nhân) |
| Khoảng thời gian | 365 ngày (2025-06-10 00:00:00 → 2026-06-09 00:00:00) |
| Chia train/test | 80% / 20% theo thời gian (time-series split) |
| SKU đánh giá | 50 |

**Mô tả cho bài báo:**

> Experiments use a synthetic Vietnamese retail sales dataset with 18250 daily records across 50 SKUs over 365 days. Data is split chronologically: 80% training, 20% testing.

---

## 3. TABLE I — So sánh mô hình dự báo

| Model | MAE | RMSE | MAPE (%) |
|-------|-----|------|----------|
| **Random Forest** | **5.2896** | **7.2673** | **12.80** |
| XGBoost | 5.3166 | 7.2516 | 12.82 |
| Moving Average | 7.1167 | 9.4480 | 17.50 |

### Kết luận RQ1

- Random Forest và XGBoost **tương đương** (MAPE 12.80 vs 12.82).
- Cả hai **vượt baseline** Moving Average: MAPE giảm từ 17.50% → ~12.80% (**~27% cải thiện**).
- MAE giảm từ 7.12 → 5.29 (**~26%**).

### LaTeX

```latex
Random Forest & 5.2896 & 7.2673 & 12.80 \\
XGBoost       & 5.3166 & 7.2516 & 12.82 \\
Moving Average& 7.1167 & 9.4480 & 17.50 \\
```

---

## 4. TABLE II — Ablation: đặc trưng lịch Việt Nam

Mô hình: XGBoost. So sánh 14 features (base) vs 18 features (+ VN calendar).

| Feature setting | MAE | RMSE | MAPE (%) |
|-----------------|-----|------|----------|
| Without VN calendar features | 5.3379 | 7.1928 | 13.11 |
| With VN calendar features | 5.3166 | 7.2516 | 12.82 |

| MAPE thay đổi | | | **+2.2%** |

### Kết luận RQ2

- Đặc trưng lịch VN **cải thiện MAPE 2.2%** (+2.2%) trên 50 SKU.
- Hiệu quả modest ở mức aggregate; có thể phân tích theo category trong future work.

### LaTeX

```latex
Without calendar features & 5.3379 & 7.1928 & 13.11 \\
With calendar features    & 5.3166 & 7.2516 & 12.82 \\
```

---

## 5. TABLE III — Đánh giá LLM (Gemini 2.5 Flash)

**API:** `POST /api/v1/ai-insight/explain-forecast/{itemId}`
**Mẫu:** 30 item, backend Docker `localhost:8080`
**Thang điểm:** Likert 1 (kém) – 5 (xuất sắc), rubric tự động

### Điểm theo mẫu

| Item | Clarity | Usefulness | Correctness | Actionability |
|------|---------|------------|-------------|---------------|
| 10 | 4.5 | 4.5 | 4.5 | 4.5 |
| 10 | 4.5 | 4.0 | 4.0 | 5.0 |
| 10 | 4.5 | 4.5 | 3.5 | 3.5 |
| 9 | 4.5 | 4.5 | 4.5 | 5.0 |
| 9 | 4.5 | 4.0 | 4.0 | 5.0 |
| 9 | 4.5 | 4.5 | 3.5 | 3.5 |
| 8 | 4.5 | 4.5 | 4.0 | 5.0 |
| 8 | 4.5 | 4.0 | 4.0 | 5.0 |
| 8 | 4.5 | 4.5 | 3.5 | 3.5 |
| 7 | 4.5 | 4.5 | 4.5 | 4.5 |
| 7 | 4.5 | 4.0 | 4.0 | 5.0 |
| 7 | 4.5 | 4.5 | 4.0 | 4.0 |
| 6 | 4.5 | 4.5 | 4.0 | 4.5 |
| 6 | 4.5 | 4.0 | 4.0 | 5.0 |
| 6 | 4.5 | 4.5 | 3.5 | 5.0 |
| 5 | 4.5 | 4.5 | 4.5 | 4.5 |
| 5 | 4.5 | 4.0 | 4.0 | 5.0 |
| 5 | 2.0 | 2.0 | 2.0 | 2.0 |
| 4 | 4.5 | 4.5 | 4.5 | 5.0 |
| 4 | 4.5 | 4.0 | 4.0 | 5.0 |
| 4 | 2.0 | 2.0 | 2.0 | 2.0 |
| 3 | 4.5 | 4.5 | 4.5 | 4.5 |
| 3 | 2.0 | 2.0 | 2.0 | 2.0 |
| 3 | 4.5 | 4.0 | 3.5 | 4.0 |
| 2 | 4.5 | 4.5 | 4.5 | 5.0 |
| 2 | 2.0 | 2.0 | 2.0 | 2.0 |
| 2 | 2.0 | 2.0 | 2.0 | 2.0 |
| 1 | 4.5 | 4.5 | 4.5 | 5.0 |
| 1 | 2.0 | 2.0 | 2.0 | 2.0 |
| 1 | 1.0 | 1.0 | 1.0 | 1.0 |
| **Mean** | **3.88** | **3.75** | **3.55** | **3.97** |

### LaTeX

```latex
Clarity      & 3.88 \\
Usefulness   & 3.75 \\
Correctness  & 3.55 \\
Actionability& 3.97 \\
```

### Kết luận RQ3

- Mean Likert: Clarity 3.88, Usefulness 3.75, Correctness 3.55, Actionability 3.97.
- Gemini tạo phân tích tiếng Việt có cấu trúc (tồn kho, dự báo ML, khuyến nghị).
- **Khuyến nghị paper:** nhờ 1–2 người chấm độc lập (xem `benchmark_llm_samples.txt`).

---

## 6. Tóm tắt điểm mạnh / hạn chế

### Điểm mạnh

1. ML: RF/XGB MAPE ~12.8%, baseline MA 17.5%.
2. VN calendar: MAPE +2.2% vs không có đặc trưng lịch.
3. LLM: mean Likert 3.88–3.75 (clarity/usefulness), actionability 3.97.

### Hạn chế

1. Dataset synthetic VN — cần validate trên dữ liệu cửa hàng thật.
2. Ablation VN calendar modest ở mức aggregate.
3. LLM evaluation: rubric auto-score — cần peer rating cho paper cuối.

---

## 7. Chạy lại

```bash
cd ai-service
source .venv/bin/activate
python benchmark_runner.py --dataset all 2>&1 | tee benchmark_results.txt
```

---

## 8. Files liên quan

| File | Mô tả |
|------|--------|
| `ai-service/benchmark_runner.py` | Script benchmark |
| `ai-service/benchmark_results.txt` | Log đầy đủ |
| `ai-service/TONG_KET_BENCHMARK_QUOC_TE.md` | VN vs UK |
| `ai-service/TONG_KET_BENCHMARK.md` | **File tổng kết này** |

---

*Báo cáo tự động từ SmartMart AI benchmark pipeline.*