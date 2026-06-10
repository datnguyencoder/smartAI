#!/usr/bin/env python3
"""Generate Vietnam FMCG synthetic daily sales for SmartMart seed (50 SKU × 365 days)."""
from __future__ import annotations

import argparse
import csv
import random
from datetime import date, timedelta
from pathlib import Path

# (code, name, category, base_daily_qty)
SKUS: list[tuple[str, str, str, int]] = [
    ("VNM-S100", "Sữa Tươi Vinamilk 100% 1L", "Sữa và các sản phẩm từ sữa", 45),
    ("VNM-YOG", "Sữa chua Vinamilk có đường", "Sữa và các sản phẩm từ sữa", 38),
    ("VNM-COND", "Sữa đặc Ông Thọ 380g", "Sữa và các sản phẩm từ sữa", 28),
    ("VNM-PROB", "Sữa chua probiotic Vinamilk", "Sữa và các sản phẩm từ sữa", 32),
    ("VNM-CHEE", "Phô mai con bò cười 8v", "Sữa và các sản phẩm từ sữa", 18),
    ("LAVIE-500", "Nước Lavie 500ml", "Đồ uống", 120),
    ("COCA-320", "Coca-Cola 320ml", "Đồ uống", 85),
    ("PEPSI-390", "Pepsi 390ml", "Đồ uống", 72),
    ("AQUA-1500", "Aquafina 1.5L", "Đồ uống", 55),
    ("REDBULL-250", "Red Bull 250ml", "Đồ uống", 40),
    ("STING-330", "Sting dâu 330ml", "Đồ uống", 65),
    ("G7-3IN1", "Cà phê G7 3in1 hộp 18 gói", "Đồ uống", 22),
    ("NESCAFE-3IN1", "Nescafé 3in1 hộp 24 gói", "Đồ uống", 20),
    ("HEINEKEN-330", "Bia Heineken Sleek 330ml", "Đồ uống", 35),
    ("TIGER-330", "Bia Tiger Crystal 330ml", "Đồ uống", 30),
    ("HAOHAO-TOM", "Mì Hảo Hảo Tôm Chua Cay", "Thực phẩm đóng gói", 95),
    ("HAOHAO-CHUA", "Mì Hảo Hảo Chua Cay", "Thực phẩm đóng gói", 88),
    ("OMACHI-BO", "Mì Omachi Bò Hầm", "Thực phẩm đóng gói", 42),
    ("KOKOMI-TOM", "Mì Kokomi Tôm", "Thực phẩm đóng gói", 55),
    ("MILO-22G", "Milo gói 22g", "Thực phẩm đóng gói", 48),
    ("CHOCOPIE-12", "Bánh Chocopie hộp 12 cái", "Đồ ăn vặt", 25),
    ("OREO-133", "Bánh Oreo 133g", "Đồ ăn vặt", 30),
    ("PIZZA-PIE", "Bánh quy Cosy Marie", "Đồ ăn vặt", 28),
    ("KITKAT-4F", "KitKat 4 thanh", "Đồ ăn vặt", 22),
    ("LAYS-56", "Snack Lays 56g", "Đồ ăn vặt", 40),
    ("CLEAR-630", "Dầu gội Clear Men 630g", "Hóa mỹ phẩm", 15),
    ("SUNSILK-650", "Dầu gội Sunsilk 650ml", "Hóa mỹ phẩm", 18),
    ("DOVE-90", "Xà phòng Dove 90g", "Hóa mỹ phẩm", 25),
    ("OMO-28", "Bột giặt OMO Matic 2.8kg", "Hóa mỹ phẩm", 12),
    ("PS-240", "Kem đánh răng P/S 240g", "Hóa mỹ phẩm", 20),
    ("LISTERINE-250", "Nước súc miệng Listerine 250ml", "Hóa mỹ phẩm", 14),
    ("PAMPERS-M", "Tã Pampers size M", "Đồ dùng cá nhân", 10),
    ("KOTEX-NIGHT", "Băng vệ sinh Kotex Night", "Đồ dùng cá nhân", 16),
    ("NIVEA-150", "Kem dưỡng Nivea 150ml", "Hóa mỹ phẩm", 12),
    ("COLGATE-180", "Kem đánh răng Colgate 180g", "Hóa mỹ phẩm", 22),
    ("UNILEVER-SOAP", "Xà phòng Lifebuoy 85g", "Hóa mỹ phẩm", 35),
    ("MAGGI-200", "Hạt nêm Maggi 200g", "Thực phẩm đóng gói", 28),
    ("KNORR-60", "Hạt nêm Knorr 60g", "Thực phẩm đóng gói", 32),
    ("CHINSU-250", "Tương ớt Chinsu 250g", "Thực phẩm đóng gói", 40),
    ("NAMNGU-500", "Nước mắm Nam Ngư 500ml", "Thực phẩm đóng gói", 25),
    ("MEGA-400", "Dầu ăn Meizan 400ml", "Thực phẩm đóng gói", 30),
    ("VIFON-PHO", "Phở Vifon gói", "Thực phẩm đóng gói", 45),
    ("BIBIGO-MANDU", "Bánh bao Bibigo Mandu", "Thực phẩm đóng gói", 18),
    ("ORION-PIE", "Bánh Orion Choco Pie", "Đồ ăn vặt", 26),
    ("BATTERY-AA", "Pin Energizer AA vỉ 2", "Đồ gia dụng", 15),
    ("BATTERY-AAA", "Pin Energizer AAA vỉ 2", "Đồ gia dụng", 12),
    ("BULB-LED9", "Bóng đèn LED 9W", "Đồ gia dụng", 8),
    ("TISSUE-200", "Khăn giấy Pulppy 200 tờ", "Đồ gia dụng", 35),
    ("BAG-TRASH", "Túi rác đen 54x70", "Đồ gia dụng", 20),
    ("MATCH-BOX", "Diêm Thống Nhất hộp", "Đồ gia dụng", 10),
]

TET_DATES = {
    date(2025, 1, 29), date(2025, 1, 30), date(2025, 1, 31), date(2025, 2, 1), date(2025, 2, 2),
    date(2026, 2, 17), date(2026, 2, 18), date(2026, 2, 19), date(2026, 2, 20), date(2026, 2, 21),
}
MID_AUTUMN = {date(2025, 10, 6), date(2026, 9, 25)}
LABOR_HOLIDAYS = {(4, 30), (5, 1)}


def days_to_nearest(d: date, holiday_set: set[date], window: int) -> int:
    min_dist = 999
    for h in holiday_set:
        dist = abs((d - h).days)
        if dist < min_dist:
            min_dist = dist
    return min_dist if min_dist <= window else 999


def multiplier(d: date, category: str) -> float:
    m = 1.0
    if days_to_nearest(d, TET_DATES, 7) <= 7:
        m *= 3.0
    if days_to_nearest(d, MID_AUTUMN, 3) <= 3 and category in ("Đồ ăn vặt", "Thực phẩm đóng gói"):
        m *= 2.5
    if (d.month, d.day) in LABOR_HOLIDAYS and category == "Đồ uống":
        m *= 1.8
    if d.weekday() >= 5:
        m *= 1.25
    if d.day in (15, 30):
        m *= 1.4
    if 5 <= d.month <= 8 and category == "Đồ uống":
        m *= 1.3
    if d.month in (12, 1) and category == "Thực phẩm đóng gói":
        m *= 1.5
    return m


def generate(days: int = 365, seed: int = 42) -> list[dict]:
    random.seed(seed)
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=days - 1)
    rows: list[dict] = []
    current = start
    while current <= end:
        for code, name, category, base in SKUS:
            noise = random.uniform(0.75, 1.25)
            qty = max(1, int(round(base * multiplier(current, category) * noise)))
            rows.append({
                "source": "vn_synthetic",
                "external_product_code": code,
                "product_name": name,
                "category_name": category,
                "sale_date": current.isoformat(),
                "quantity": qty,
            })
        current += timedelta(days=1)
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        default="backend/src/main/resources/data/retail/vn_synthetic_daily.csv",
    )
    parser.add_argument("--days", type=int, default=365)
    args = parser.parse_args()
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    rows = generate(days=args.days)
    with out.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["source", "external_product_code", "product_name", "category_name", "sale_date", "quantity"],
        )
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {out}")


if __name__ == "__main__":
    main()
