# Tổng kết Benchmark Quốc tế — Vietnam vs UK

**Ngày chạy:** 2026-06-14 16:00

## 1. Tổng quan dataset

| Dataset | Vùng | SKU | Ngày | Ghi chú |
|---------|------|-----|------|---------|
| Vietnam (Synthetic FMCG) | Vietnam | 50 | 365 | Synthetic, có Tết/VN calendar |
| UK (UCI Online Retail) | United Kingdom | 50 | 127 | UCI Online Retail, UK thực |

### Về dữ liệu US (Mỹ)

Trong repo **không có** dataset US đủ lớn để benchmark ML:
- UCI Online Retail chỉ có **291 giao dịch** country=`USA`, không SKU nào có ≥30 ngày lịch sử.
- Để benchmark US: tải **Kaggle M5 (Walmart)** hoặc **Store Sales Favorita** (Latin America).

## 2. TABLE I — So sánh mô hình theo quốc gia

| Region | Best model | MAE | RMSE | MAPE (%) | N_SKU |
|--------|------------|-----|------|----------|-------|
| Vietnam | Random Forest | 5.2896 | 7.2673 | 12.80 | 50 |
| United Kingdom | Moving Average | 18.4125 | 44.9832 | 332.05 | 49 |

### Giải thích TABLE I

| Cột | Ý nghĩa | Cách đọc |
|-----|---------|----------|
| **MAE** | Mean Absolute Error — sai số tuyệt đối trung bình (đơn vị: sản phẩm/ngày) | Càng **thấp** càng tốt. MAE=5 nghĩa là dự báo lệch ~5 đơn vị so với thực tế. |
| **RMSE** | Root Mean Squared Error — phạt nặng sai số lớn | Càng **thấp** càng tốt. RMSE > MAE khi có outlier (ngày bán đột biến). |
| **MAPE (%)** | Mean Absolute Percentage Error — % sai số so với giá trị thực | Càng **thấp** càng tốt. MAPE 12% = dự báo lệch ~12% so với doanh số thực. |
| **Moving Average** | Baseline — trung bình 7 ngày gần nhất | Mô hình đơn giản, dùng làm điểm so sánh. |
| **Random Forest** | Ensemble cây — ổn định với nhiễu | Thường tốt với FMCG có outlier. |
| **XGBoost** | Gradient boosting — bắt phi tuyến, mùa vụ | Benchmark phổ biến trong retail forecasting (M5 competition). |

## 3. Chi tiết theo dataset

### Vietnam (Synthetic FMCG)

| Model | MAE | RMSE | MAPE (%) |
|-------|-----|------|----------|
| Moving Average | 7.1167 | 9.4480 | 17.50 |
| Random Forest | 5.2896 | 7.2673 | 12.80 |
| XGBoost | 5.3166 | 7.2516 | 12.82 |

| Ablation | MAE | RMSE | MAPE (%) |
|----------|-----|------|----------|
| Không VN calendar | 5.3379 | 7.1928 | 13.11 |
| Có VN calendar | 5.3166 | 7.2516 | 12.82 |
| MAPE thay đổi | | | +2.2% |

### UK (UCI Online Retail)

| Model | MAE | RMSE | MAPE (%) |
|-------|-----|------|----------|
| Moving Average | 18.4125 | 44.9832 | 332.05 |
| Random Forest | 19.4610 | 43.8495 | 368.94 |
| XGBoost | 18.6425 | 49.3896 | 382.09 |

| Ablation | MAE | RMSE | MAPE (%) |
|----------|-----|------|----------|
| Không VN calendar | 18.6249 | 49.3851 | 381.47 |
| Có VN calendar | 18.6425 | 49.3896 | 382.09 |
| MAPE thay đổi | | | -0.2% |

## 4. TABLE III — LLM Explanation Evaluation (Likert 1–5)

Gemini 2.5 Flash via `POST /api/v1/ai-insight/explain-forecast/{itemId}`.
5 samples; scores from rubric-based evaluation (see `benchmark_llm_samples.txt`).

| Criterion | Mean Score (1–5) |
|-----------|------------------|
| Clarity | 3.88 |
| Usefulness | 3.75 |
| Correctness | 3.55 |
| Actionability | 3.97 |

**LaTeX:**

```latex
Clarity      & 3.88 \\
Usefulness   & 3.75 \\
Correctness  & 3.55 \\
Actionability& 3.97 \\
```

## 5. TABLE II — Giải thích Ablation (đặc trưng lịch Việt Nam)

| Feature | Mô tả | Tại sao quan trọng (VN) |
|---------|-------|-------------------------|
| `tet_proximity` | Khoảng cách đến Tết Nguyên đán | Nhu cầu tăng 2–3x trước Tết |
| `mid_autumn_proximity` | Gần Tết Trung Thu | Bánh kẹo, đồ ăn vặt tăng |
| `is_hung_vuong` | Ngày Giỗ tổ Hùng Vương | Ngày lễ cố định VN |
| `is_holiday` | 30/4, 1/5, 2/9, 1/1 | Ngày nghỉ lễ VN |

Trên data **UK**, các feature này **không có ý nghĩa văn hóa** → ablation chỉ để chứng minh VN features không gây hại trên data ngoài VN.

## 6. Cách trình bày trong bài báo

1. **Experimental setup**: Mô tả 2 dataset (VN synthetic 365d, UK UCI 127d), split 80/20 chronological.
2. **TABLE I**: Một bảng per region hoặc bảng gộp cross-country.
3. **TABLE II**: Chỉ nhấn VN calendar improvement trên dataset VN; UK là negative control.
4. **Discussion**: So sánh MAPE VN vs UK — khác biệt do độ dài chuỗi, mùa vụ, quy mô SKU.
5. **Limitation**: US data không có trong repo; đề xuất M5/Favorita cho future work.

## 7. Chạy lại

```bash
cd ai-service
source .venv/bin/activate
python benchmark_runner.py --dataset all
```
