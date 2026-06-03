#!/usr/bin/env python3
"""
Convert Kaggle Store Sales - Time Series Forecasting (Corporación Favorita) train.csv
to SmartMart daily sales CSV.

Download train.csv (accept competition rules on Kaggle), then:
  python scripts/retail/prepare_favorita_daily.py \\
    --input ai-service/datasets/raw/favorita/train.csv \\
    --store 1 --top-families 8 --last-days 180
"""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DIR = REPO_ROOT / "ai-service" / "datasets" / "processed"
BE_DATA_DIR = REPO_ROOT / "backend" / "src" / "main" / "resources" / "data" / "retail"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--store", type=int, default=1, help="store_nbr filter")
    parser.add_argument("--top-families", type=int, default=8)
    parser.add_argument("--last-days", type=int, default=180)
    args = parser.parse_args()

    if not args.input.exists():
        raise SystemExit(f"Missing: {args.input}. Download from Kaggle competition data.")

    df = pd.read_csv(args.input, parse_dates=["date"])
    df = df[(df["store_nbr"] == args.store) & (df["sales"] >= 0)].copy()
    df = df.rename(columns={"family": "product_name", "sales": "quantity"})
    df["external_product_code"] = df["product_name"].str.replace(" ", "_").str.upper()
    df["category_name"] = "Favorita " + df["product_name"]
    df["source"] = "kaggle_favorita"
    df["sale_date"] = df["date"].dt.strftime("%Y-%m-%d")

    max_date = df["date"].max()
    min_date = max_date - pd.Timedelta(days=args.last_days - 1)
    windowed = df[df["date"] >= min_date]

    top = (
        windowed.groupby("external_product_code")["quantity"]
        .sum()
        .sort_values(ascending=False)
        .head(args.top_families)
        .index
    )
    daily = (
        windowed[windowed["external_product_code"].isin(top)]
        .groupby(["source", "external_product_code", "product_name", "category_name", "sale_date"], as_index=False)[
            "quantity"
        ]
        .sum()
    )

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    BE_DATA_DIR.mkdir(parents=True, exist_ok=True)

    out_processed = PROCESSED_DIR / f"favorita_store{args.store}_daily.csv"
    out_seed = BE_DATA_DIR / f"favorita_store{args.store}_daily.csv"
    daily.to_csv(out_processed, index=False)
    daily.to_csv(out_seed, index=False)
    print(f"Wrote {len(daily):,} rows -> {out_processed}")
    print(f"Wrote {len(daily):,} rows -> {out_seed}")


if __name__ == "__main__":
    main()
