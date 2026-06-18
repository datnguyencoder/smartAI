#!/usr/bin/env python3
"""
Tải dataset retail chuẩn từ Internet và chuẩn bị CSV daily cho SmartMart.

Nguồn mặc định: UCI Online Retail (CC BY 4.0)
  https://archive.ics.uci.edu/dataset/352/online+retail
Mirror ổn định: Databricks Spark Guide (~541k dòng giao dịch, 2010–2011)

Usage:
  python scripts/retail/download_retail_dataset.py
  python scripts/retail/download_retail_dataset.py --top-products 50 --last-days 365
"""

from __future__ import annotations

import argparse
import hashlib
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = REPO_ROOT / "ai-service" / "datasets" / "raw"
DEFAULT_RAW = RAW_DIR / "online-retail-dataset.csv"

UCI_MIRROR_URL = (
    "https://raw.githubusercontent.com/databricks/Spark-The-Definitive-Guide/"
    "master/data/retail-data/all/online-retail-dataset.csv"
)
UCI_SAMPLE_URL = (
    "https://raw.githubusercontent.com/databricks/Spark-The-Definitive-Guide/"
    "master/data/retail-data/all/online-retail-sample.csv"
)

DATASET_META = {
    "name": "UCI Online Retail",
    "license": "CC BY 4.0",
    "url": "https://archive.ics.uci.edu/dataset/352/online+retail",
    "mirror": UCI_MIRROR_URL,
    "period": "2010-12-01 .. 2011-12-09",
    "transactions": "~541,909",
}


def download(url: str, dest: Path, timeout: int = 120) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "SmartMart-AI/1.0 (retail dataset fetch)"},
    )
    print(f"Downloading {url}")
    print(f"  -> {dest}")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read()
    dest.write_bytes(data)
    sha = hashlib.sha256(data).hexdigest()[:16]
    print(f"  OK {len(data):,} bytes, sha256[:16]={sha}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Download UCI Online Retail and prepare daily CSV")
    parser.add_argument("--url", default=UCI_MIRROR_URL, help="Raw CSV URL")
    parser.add_argument("--output", type=Path, default=DEFAULT_RAW, help="Local raw CSV path")
    parser.add_argument("--top-products", type=int, default=50, help="Top SKUs for BE seeder")
    parser.add_argument("--last-days", type=int, default=365, help="Trailing window for seeder subset")
    parser.add_argument("--force", action="store_true", help="Re-download even if file exists")
    parser.add_argument("--sample-only", action="store_true", help="Use IBM sample (~3k rows) for quick test")
    args = parser.parse_args()

    url = UCI_SAMPLE_URL if args.sample_only else args.url
    raw_path = args.output

    if raw_path.exists() and not args.force:
        print(f"Raw file exists (skip download): {raw_path}")
        print("  Use --force to re-download")
    else:
        try:
            download(url, raw_path)
        except urllib.error.HTTPError as ex:
            print(f"HTTP error {ex.code}: {ex.reason}", file=sys.stderr)
            return 1
        except urllib.error.URLError as ex:
            print(f"Network error: {ex.reason}", file=sys.stderr)
            return 1

    # Delegate aggregation to existing script (same venv / python)
    import subprocess

    prepare_script = REPO_ROOT / "scripts" / "retail" / "prepare_uci_daily.py"
    cmd = [
        sys.executable,
        str(prepare_script),
        "--input",
        str(raw_path),
        "--top-products",
        str(args.top_products),
        "--last-days",
        str(args.last_days),
    ]
    result = subprocess.run(cmd, check=False)
    if result.returncode != 0:
        return result.returncode

    meta_path = RAW_DIR / "DATASET_SOURCE.md"
    meta_path.write_text(
        "\n".join(
            [
                f"# {DATASET_META['name']}",
                "",
                f"- **License:** {DATASET_META['license']}",
                f"- **Official:** {DATASET_META['url']}",
                f"- **Mirror used:** {DATASET_META['mirror']}",
                f"- **Period:** {DATASET_META['period']}",
                f"- **Transactions:** {DATASET_META['transactions']}",
                f"- **Prepared:** top {args.top_products} SKU × {args.last_days} days",
                "",
                "Backend seeder: `RetailSalesHistorySeeder` → `orders` prefix `RETAIL-`",
            ]
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote metadata -> {meta_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
