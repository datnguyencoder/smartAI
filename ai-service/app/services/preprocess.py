from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "sales_lag_1",
    "sales_lag_2",
    "sales_lag_3",
    "sales_lag_7",
    "sales_lag_14",
    "rolling_mean_7",
    "rolling_mean_30",
    "rolling_std_7",
    "rolling_max_7",
    "day_of_week",
    "day_of_month",
    "month",
    "is_weekend",
    "is_holiday",
    "is_hung_vuong",
    "tet_proximity",
    "mid_autumn_proximity",
    "category_id",
]

# Ngày lễ cố định Việt Nam (MM-DD)
_VN_HOLIDAY_MD = {
    "01-01",
    "04-30",
    "05-01",
    "09-02",
}

_VN_HOLIDAY_DATES: set[str] = set()
_VN_TET_DATES: list[date] = []
_VN_MID_AUTUMN_DATES: list[date] = []
_VN_HUNG_VUONG_DATES: set[str] = set()


def _load_holiday_data() -> None:
    global _VN_HOLIDAY_DATES, _VN_TET_DATES, _VN_MID_AUTUMN_DATES, _VN_HUNG_VUONG_DATES
    if _VN_HOLIDAY_DATES:
        return

    path = Path(__file__).resolve().parent.parent / "data" / "holidays_vn.json"
    if path.exists():
        payload = json.loads(path.read_text(encoding="utf-8"))
        for key in ("lunar_new_year", "extra"):
            for raw in payload.get(key, []):
                _VN_HOLIDAY_DATES.add(str(raw))
        for raw in payload.get("lunar_new_year", []):
            _VN_TET_DATES.append(date.fromisoformat(str(raw)))
        for raw in payload.get("mid_autumn", []):
            _VN_MID_AUTUMN_DATES.append(date.fromisoformat(str(raw)))
        for raw in payload.get("hung_vuong", []):
            _VN_HUNG_VUONG_DATES.add(str(raw))
            _VN_HOLIDAY_DATES.add(str(raw))


def is_vietnam_holiday(d: date) -> bool:
    _load_holiday_data()
    if d.strftime("%m-%d") in _VN_HOLIDAY_MD:
        return True
    return d.isoformat() in _VN_HOLIDAY_DATES


def is_hung_vuong(d: date) -> bool:
    _load_holiday_data()
    return d.isoformat() in _VN_HUNG_VUONG_DATES


def _proximity_score(d: date, holiday_dates: list[date], window: int = 30) -> float:
    if not holiday_dates:
        return 0.0
    min_dist = min(abs((d - h).days) for h in holiday_dates)
    if min_dist > window:
        return 0.0
    return max(0.0, (window - min_dist) / window)


MIN_ML_HISTORY_DAYS = 30
MA_WINDOW = 7


def sales_records_to_dataframe(records: list[dict]) -> pd.DataFrame:
    if not records:
        return pd.DataFrame(columns=["item_id", "sale_date", "quantity", "category_id"])

    frame = pd.DataFrame(records)
    frame["sale_date"] = pd.to_datetime(frame["sale_date"])
    frame["quantity"] = frame["quantity"].astype(float)
    frame["category_id"] = frame["category_id"].astype(int)
    frame["item_id"] = frame["item_id"].astype(int)
    return frame


def fill_missing_dates(frame: pd.DataFrame) -> pd.DataFrame:
    if frame.empty:
        return frame

    filled_frames: list[pd.DataFrame] = []
    for item_id, group in frame.groupby("item_id"):
        category_id = int(group["category_id"].iloc[0])
        start = group["sale_date"].min()
        end = group["sale_date"].max()
        full_range = pd.date_range(start=start, end=end, freq="D")

        daily = (
            group.groupby("sale_date", as_index=False)["quantity"]
            .sum()
            .set_index("sale_date")
            .reindex(full_range, fill_value=0.0)
            .rename_axis("sale_date")
            .reset_index()
        )
        daily["item_id"] = int(item_id)
        daily["category_id"] = category_id
        filled_frames.append(daily)

    return pd.concat(filled_frames, ignore_index=True)


def count_history_days(frame: pd.DataFrame, item_id: int) -> int:
    item_rows = frame[frame["item_id"] == item_id]
    if item_rows.empty:
        return 0
    return int(item_rows["sale_date"].nunique())


def build_features(frame: pd.DataFrame) -> pd.DataFrame:
    if frame.empty:
        return frame

    _load_holiday_data()
    working = frame.sort_values(["item_id", "sale_date"]).copy()

    for lag in (1, 2, 3, 7, 14):
        working[f"sales_lag_{lag}"] = working.groupby("item_id")["quantity"].shift(lag)

    working["rolling_mean_7"] = (
        working.groupby("item_id")["quantity"].transform(lambda s: s.rolling(7, min_periods=1).mean())
    )
    working["rolling_mean_30"] = (
        working.groupby("item_id")["quantity"].transform(lambda s: s.rolling(30, min_periods=1).mean())
    )
    working["rolling_std_7"] = (
        working.groupby("item_id")["quantity"].transform(lambda s: s.rolling(7, min_periods=1).std())
    )
    working["rolling_max_7"] = (
        working.groupby("item_id")["quantity"].transform(lambda s: s.rolling(7, min_periods=1).max())
    )

    working["day_of_week"] = working["sale_date"].dt.dayofweek
    working["day_of_month"] = working["sale_date"].dt.day
    working["month"] = working["sale_date"].dt.month
    working["is_weekend"] = working["day_of_week"].isin([5, 6]).astype(int)
    working["is_holiday"] = working["sale_date"].apply(lambda ts: int(is_vietnam_holiday(ts.date())))
    working["is_hung_vuong"] = working["sale_date"].apply(lambda ts: int(is_hung_vuong(ts.date())))
    working["tet_proximity"] = working["sale_date"].apply(
        lambda ts: _proximity_score(ts.date(), _VN_TET_DATES, 30)
    )
    working["mid_autumn_proximity"] = working["sale_date"].apply(
        lambda ts: _proximity_score(ts.date(), _VN_MID_AUTUMN_DATES, 14)
    )

    working[FEATURE_COLUMNS] = working[FEATURE_COLUMNS].fillna(0.0)
    working["rolling_std_7"] = working["rolling_std_7"].fillna(0.0)
    working["rolling_max_7"] = working["rolling_max_7"].fillna(0.0)

    return working


def prepare_training_dataset(records: list[dict]) -> tuple[pd.DataFrame, pd.DataFrame]:
    raw = sales_records_to_dataframe(records)
    filled = fill_missing_dates(raw)
    featured = build_features(filled)
    featured = featured.dropna(subset=FEATURE_COLUMNS)
    return filled, featured


def time_series_split(featured: pd.DataFrame, test_ratio: float = 0.2) -> tuple[pd.DataFrame, pd.DataFrame]:
    if featured.empty:
        return featured, featured

    split_date = featured["sale_date"].quantile(1 - test_ratio)
    train = featured[featured["sale_date"] <= split_date].copy()
    test = featured[featured["sale_date"] > split_date].copy()

    if test.empty:
        split_idx = max(1, int(len(featured) * (1 - test_ratio)))
        train = featured.iloc[:split_idx].copy()
        test = featured.iloc[split_idx:].copy()

    return train, test


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)

    mae = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))

    nonzero = y_true != 0
    if nonzero.any():
        mape = float(np.mean(np.abs((y_true[nonzero] - y_pred[nonzero]) / y_true[nonzero])) * 100)
    else:
        mape = 0.0

    return {"mae": mae, "rmse": rmse, "mape": mape}


def moving_average_daily_forecast(history: list[float], horizon: int, window: int = MA_WINDOW) -> list[float]:
    series = list(history)
    predictions: list[float] = []

    for _ in range(horizon):
        recent = series[-window:] if series else [0.0]
        next_value = float(np.mean(recent)) if recent else 0.0
        predictions.append(max(next_value, 0.0))
        series.append(next_value)

    return predictions


def extend_history_with_sales(
    item_id: int,
    category_id: int,
    records: list[dict],
    lookback_days: int = 60,
) -> pd.DataFrame:
    raw = sales_records_to_dataframe(records)
    raw = raw[raw["item_id"] == item_id]
    if raw.empty:
        end = pd.Timestamp(date.today())
        start = end - timedelta(days=lookback_days - 1)
        dates = pd.date_range(start=start, end=end, freq="D")
        return pd.DataFrame(
            {
                "item_id": item_id,
                "sale_date": dates,
                "quantity": 0.0,
                "category_id": category_id,
            }
        )

    filled = fill_missing_dates(raw)
    end = filled["sale_date"].max()
    start = end - timedelta(days=lookback_days - 1)
    filled = filled[filled["sale_date"] >= start].copy()
    return filled.sort_values("sale_date").reset_index(drop=True)
