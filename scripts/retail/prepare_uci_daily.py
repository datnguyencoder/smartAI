#!/usr/bin/env python3
"""
Aggregate UCI / Kaggle-mirror Online Retail transactions into daily sales for SmartMart AI.

Sources (place under ai-service/datasets/raw/):
  - online-retail-dataset.csv  (Databricks mirror of UCI, ~541k rows)
  - online-retail-sample.csv   (IBM sample, optional)

Output:
  - ai-service/datasets/processed/uci_online_retail_daily.csv
  - backend/src/main/resources/data/retail/uci_online_retail_daily.csv  (top products, last N days)

Kaggle Store Sales (Favorita): use prepare_favorita_daily.py with train.csv from:
  https://www.kaggle.com/competitions/store-sales-time-series-forecasting/data
"""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = REPO_ROOT / "ai-service" / "datasets" / "raw"
PROCESSED_DIR = REPO_ROOT / "ai-service" / "datasets" / "processed"
BE_DATA_DIR = REPO_ROOT / "backend" / "src" / "main" / "resources" / "data" / "retail"


def load_transactions(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, encoding="latin-1", low_memory=False)
    df.columns = [c.strip() for c in df.columns]
    df["InvoiceDate"] = pd.to_datetime(df["InvoiceDate"], errors="coerce", dayfirst=True)
    df["Quantity"] = pd.to_numeric(df["Quantity"], errors="coerce")
    df = df.dropna(subset=["InvoiceDate", "Quantity", "StockCode"])
    df = df[df["Quantity"] > 0]
    df = df[~df["InvoiceNo"].astype(str).str.startswith("C", na=False)]
    df["StockCode"] = df["StockCode"].astype(str).str.strip()
    if "Description" not in df.columns:
        df["Description"] = df["StockCode"]
    else:
        df["Description"] = df["Description"].fillna(df["StockCode"]).astype(str).str.strip()
    return df


def to_daily(df: pd.DataFrame) -> pd.DataFrame:
    daily = (
        df.groupby(["StockCode", "Description", df["InvoiceDate"].dt.date], as_index=False)["Quantity"]
        .sum()
        .rename(columns={"InvoiceDate": "sale_date", "Quantity": "quantity"})
    )
    daily["sale_date"] = pd.to_datetime(daily["sale_date"]).dt.strftime("%Y-%m-%d")
    daily = daily.rename(
        columns={"StockCode": "external_product_code", "Description": "product_name"}
    )
    daily["category_name"] = "Đồ uống & bán lẻ"
    daily["source"] = "uci_online_retail"
    return daily[
        [
            "source",
            "external_product_code",
            "product_name",
            "category_name",
            "sale_date",
            "quantity",
        ]
    ].sort_values(["external_product_code", "sale_date"])


def subset_for_seeder(daily: pd.DataFrame, top_products: int, last_days: int) -> pd.DataFrame:
    daily = daily.copy()
    daily["sale_dt"] = pd.to_datetime(daily["sale_date"])
    max_date = daily["sale_dt"].max()
    min_date = max_date - pd.Timedelta(days=last_days - 1)
    windowed = daily[daily["sale_dt"] >= min_date].copy()

    totals = (
        windowed.groupby("external_product_code")["quantity"]
        .sum()
        .sort_values(ascending=False)
        .head(top_products)
        .index
    )
    out = windowed[windowed["external_product_code"].isin(totals)].drop(columns=["sale_dt"])
    return out.sort_values(["external_product_code", "sale_date"])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input",
        type=Path,
        default=RAW_DIR / "online-retail-dataset.csv",
        help="Raw UCI Online Retail CSV",
    )
    parser.add_argument("--top-products", type=int, default=8)
    parser.add_argument("--last-days", type=int, default=180)
    args = parser.parse_args()

    if not args.input.exists():
        raise SystemExit(f"Missing input: {args.input}")

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    BE_DATA_DIR.mkdir(parents=True, exist_ok=True)

    tx = load_transactions(args.input)
    daily = to_daily(tx)

    full_path = PROCESSED_DIR / "uci_online_retail_daily.csv"
    daily.to_csv(full_path, index=False)
    print(f"Wrote {len(daily):,} daily rows -> {full_path}")

    seed = subset_for_seeder(daily, args.top_products, args.last_days)
    seed_path = BE_DATA_DIR / "uci_online_retail_daily.csv"
    seed.to_csv(seed_path, index=False)
    print(
        f"Wrote seeder subset ({args.top_products} products, {args.last_days} days, "
        f"{len(seed):,} rows) -> {seed_path}"
    )


if __name__ == "__main__":
    main()
