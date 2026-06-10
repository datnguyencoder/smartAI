from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor

from app.services import model_store, preprocess


def _train_random_forest(x_train: np.ndarray, y_train: np.ndarray) -> RandomForestRegressor:
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=8,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(x_train, y_train)
    return model


def _train_xgboost(x_train: np.ndarray, y_train: np.ndarray) -> XGBRegressor:
    model = XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        n_jobs=-1,
        objective="reg:squarederror",
    )
    model.fit(x_train, y_train)
    return model


def _evaluate_model(model: Any, x_test: np.ndarray, y_test: np.ndarray) -> dict[str, float]:
    predictions = model.predict(x_test)
    predictions = np.clip(predictions, 0, None)
    return preprocess.compute_metrics(y_test, predictions)


def _train_moving_average_baseline(y_train: np.ndarray, y_test: np.ndarray) -> dict[str, float]:
    window = preprocess.MA_WINDOW
    predictions = []
    history = list(y_train)

    for actual in y_test:
        recent = history[-window:] if history else [0.0]
        predicted = float(np.mean(recent)) if recent else 0.0
        predictions.append(max(predicted, 0.0))
        history.append(actual)

    return preprocess.compute_metrics(y_test, np.asarray(predictions))


def _pick_winner_for_item(
    item_featured,
) -> tuple[str, Any | None, dict[str, float]]:
    train_df, test_df = preprocess.time_series_split(item_featured)
    if train_df.empty or test_df.empty or len(test_df) < 2:
        return "moving_average", None, {"mae": 0.0, "rmse": 0.0, "mape": 0.0}

    x_train = train_df[preprocess.FEATURE_COLUMNS].to_numpy()
    y_train = train_df["quantity"].to_numpy()
    x_test = test_df[preprocess.FEATURE_COLUMNS].to_numpy()
    y_test = test_df["quantity"].to_numpy()

    if len(y_train) < 5:
        metrics = _train_moving_average_baseline(y_train, y_test)
        return "moving_average", None, metrics

    rf_model = _train_random_forest(x_train, y_train)
    xgb_model = _train_xgboost(x_train, y_train)
    rf_metrics = _evaluate_model(rf_model, x_test, y_test)
    xgb_metrics = _evaluate_model(xgb_model, x_test, y_test)

    if rf_metrics["mape"] <= xgb_metrics["mape"]:
        return "random_forest", rf_model, rf_metrics
    return "xgboost", xgb_model, xgb_metrics


def train_from_sales_history(records: list[dict]) -> dict[str, Any]:
    if not records:
        raise ValueError("sales_history must not be empty")

    filled, featured = preprocess.prepare_training_dataset(records)
    if filled.empty:
        raise ValueError("sales_history must contain valid records")

    item_model_types: dict[str, str] = {}
    item_models: dict[str, Any] = {}
    per_item_metrics: list[dict[str, float]] = []

    for item_id in filled["item_id"].unique():
        item_id_int = int(item_id)
        days = preprocess.count_history_days(filled, item_id_int)
        if days < preprocess.MIN_ML_HISTORY_DAYS:
            item_model_types[str(item_id)] = "moving_average"
            continue

        item_featured = featured[featured["item_id"] == item_id].copy()
        winner_type, winner_model, metrics = _pick_winner_for_item(item_featured)
        item_model_types[str(item_id)] = winner_type
        if winner_model is not None:
            item_models[str(item_id)] = winner_model
            per_item_metrics.append(metrics)

    if not per_item_metrics:
        _, featured_all = preprocess.prepare_training_dataset(records)
        train_df, test_df = preprocess.time_series_split(featured_all)
        y_train = train_df["quantity"].to_numpy()
        y_test = test_df["quantity"].to_numpy()
        metrics = _train_moving_average_baseline(y_train, y_test)
        bundle = {
            "model_type": "moving_average",
            "ml_model": None,
            "item_models": {},
            "feature_columns": preprocess.FEATURE_COLUMNS,
            "ma_window": preprocess.MA_WINDOW,
            "item_model_types": {
                str(item_id): "moving_average" for item_id in filled["item_id"].unique()
            },
        }
        n_ma = len(bundle["item_model_types"])
        meta = {
            **metrics,
            "model_type": "moving_average",
            "item_model_types": bundle["item_model_types"],
            "training_samples": int(len(filled)),
            "n_items_ml": 0,
            "n_items_ma": n_ma,
        }
        model_store.save_training_artifacts(bundle, meta)
        return meta

    avg_metrics = {
        "mae": float(np.mean([m["mae"] for m in per_item_metrics])),
        "rmse": float(np.mean([m["rmse"] for m in per_item_metrics])),
        "mape": float(np.mean([m["mape"] for m in per_item_metrics])),
    }

    type_counts: dict[str, int] = {}
    for t in item_model_types.values():
        type_counts[t] = type_counts.get(t, 0) + 1
    global_type = max(type_counts, key=type_counts.get)

    bundle = {
        "model_type": global_type,
        "ml_model": next(iter(item_models.values()), None) if item_models else None,
        "item_models": item_models,
        "feature_columns": preprocess.FEATURE_COLUMNS,
        "ma_window": preprocess.MA_WINDOW,
        "item_model_types": item_model_types,
    }
    n_ml = sum(1 for t in item_model_types.values() if t != "moving_average")
    n_ma = sum(1 for t in item_model_types.values() if t == "moving_average")
    meta = {
        **avg_metrics,
        "model_type": global_type,
        "item_model_types": item_model_types,
        "training_samples": int(len(filled)),
        "n_items_ml": n_ml,
        "n_items_ma": n_ma,
    }
    model_store.save_training_artifacts(bundle, meta)
    return meta
