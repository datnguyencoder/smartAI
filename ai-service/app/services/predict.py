from __future__ import annotations

from datetime import timedelta

import numpy as np
import pandas as pd

from app.services import model_store, preprocess


def _sum_horizon(daily_predictions: list[float], days: int) -> float:
    return float(sum(daily_predictions[:days]))


def _forecast_with_moving_average(history: pd.DataFrame, horizon: int) -> list[float]:
    quantities = history["quantity"].tolist()
    return preprocess.moving_average_daily_forecast(
        quantities,
        horizon=horizon,
        window=preprocess.MA_WINDOW,
    )


def _build_next_row(history: pd.DataFrame, next_date: pd.Timestamp, category_id: int) -> pd.DataFrame:
    extended = history.copy()
    extended = pd.concat(
        [
            extended,
            pd.DataFrame(
                {
                    "item_id": [int(history["item_id"].iloc[0])],
                    "sale_date": [next_date],
                    "quantity": [0.0],
                    "category_id": [category_id],
                }
            ),
        ],
        ignore_index=True,
    )
    featured = preprocess.build_features(extended)
    return featured.iloc[[-1]].copy()


def _forecast_with_ml_model(
    history: pd.DataFrame,
    category_id: int,
    ml_model,
    feature_columns: list[str],
    horizon: int,
) -> list[float]:
    working = history.copy()
    predictions: list[float] = []

    for step in range(horizon):
        next_date = working["sale_date"].max() + timedelta(days=1)
        next_row = _build_next_row(working, next_date, category_id)
        features = next_row[feature_columns].to_numpy()
        predicted = float(ml_model.predict(features)[0])
        predicted = max(predicted, 0.0)
        predictions.append(predicted)

        working = pd.concat(
            [
                working,
                pd.DataFrame(
                    {
                        "item_id": [int(working["item_id"].iloc[0])],
                        "sale_date": [next_date],
                        "quantity": [predicted],
                        "category_id": [category_id],
                    }
                ),
            ],
            ignore_index=True,
        )

    return predictions


def forecast_item(
    item_id: int,
    category_id: int,
    recent_sales: list[dict],
    bundle: dict | None,
    horizon: int = 30,
) -> tuple[list[float], str]:
    history = preprocess.extend_history_with_sales(item_id, category_id, recent_sales)
    history_days = int(history["sale_date"].nunique())

    if bundle is None or history_days < preprocess.MIN_ML_HISTORY_DAYS:
        return _forecast_with_moving_average(history, horizon), "moving_average"

    item_model_types = bundle.get("item_model_types", {})
    item_type = item_model_types.get(str(item_id), bundle.get("model_type", "moving_average"))

    if item_type == "moving_average" or bundle.get("ml_model") is None:
        return _forecast_with_moving_average(history, horizon), "moving_average"

    daily = _forecast_with_ml_model(
        history=history,
        category_id=category_id,
        ml_model=bundle["ml_model"],
        feature_columns=bundle["feature_columns"],
        horizon=horizon,
    )
    return daily, item_type


def forecast_all_items(items: list[dict]) -> list[dict]:
    bundle = model_store.load_model_bundle()
    forecasts: list[dict] = []

    for item in items:
        item_id = int(item["item_id"])
        category_id = int(item["category_id"])
        recent_sales = [record.model_dump() if hasattr(record, "model_dump") else record for record in item["recent_sales"]]

        daily, model_type = forecast_item(
            item_id=item_id,
            category_id=category_id,
            recent_sales=recent_sales,
            bundle=bundle,
        )
        history = preprocess.extend_history_with_sales(item_id, category_id, recent_sales)
        start = history["sale_date"].max() if not history.empty else pd.Timestamp.today()
        daily_series = [
            {
                "date": (start + timedelta(days=i + 1)).strftime("%Y-%m-%d"),
                "predicted_qty": round(float(qty), 4),
            }
            for i, qty in enumerate(daily[:30])
        ]
        forecasts.append(
            {
                "item_id": item_id,
                "predicted_qty_7d": _sum_horizon(daily, 7),
                "predicted_qty_14d": _sum_horizon(daily, 14),
                "predicted_qty_30d": _sum_horizon(daily, 30),
                "model_type": model_type,
                "daily_series": daily_series,
            }
        )

    return forecasts
