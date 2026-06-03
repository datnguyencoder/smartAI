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


def train_from_sales_history(records: list[dict]) -> dict[str, Any]:
    filled, featured = preprocess.prepare_training_dataset(records)

    ml_items = [
        item_id
        for item_id in filled["item_id"].unique()
        if preprocess.count_history_days(filled, int(item_id)) >= preprocess.MIN_ML_HISTORY_DAYS
    ]

    if not ml_items:
        _, featured_all = preprocess.prepare_training_dataset(records)
        train_df, test_df = preprocess.time_series_split(featured_all)
        y_train = train_df["quantity"].to_numpy()
        y_test = test_df["quantity"].to_numpy()
        metrics = _train_moving_average_baseline(y_train, y_test)

        bundle = {
            "model_type": "moving_average",
            "ml_model": None,
            "feature_columns": preprocess.FEATURE_COLUMNS,
            "ma_window": preprocess.MA_WINDOW,
            "item_model_types": {
                str(item_id): "moving_average" for item_id in filled["item_id"].unique()
            },
        }
        model_store.save_training_artifacts(bundle, {**metrics, "model_type": "moving_average"})
        return {**metrics, "model_type": "moving_average"}

    ml_featured = featured[featured["item_id"].isin(ml_items)].copy()
    train_df, test_df = preprocess.time_series_split(ml_featured)

    x_train = train_df[preprocess.FEATURE_COLUMNS].to_numpy()
    y_train = train_df["quantity"].to_numpy()
    x_test = test_df[preprocess.FEATURE_COLUMNS].to_numpy()
    y_test = test_df["quantity"].to_numpy()

    rf_model = _train_random_forest(x_train, y_train)
    xgb_model = _train_xgboost(x_train, y_train)

    rf_metrics = _evaluate_model(rf_model, x_test, y_test)
    xgb_metrics = _evaluate_model(xgb_model, x_test, y_test)

    if rf_metrics["mape"] <= xgb_metrics["mape"]:
        winner_type = "random_forest"
        winner_model = rf_model
        winner_metrics = rf_metrics
    else:
        winner_type = "xgboost"
        winner_model = xgb_model
        winner_metrics = xgb_metrics

    item_model_types: dict[str, str] = {}
    for item_id in filled["item_id"].unique():
        days = preprocess.count_history_days(filled, int(item_id))
        if days < preprocess.MIN_ML_HISTORY_DAYS:
            item_model_types[str(item_id)] = "moving_average"
        else:
            item_model_types[str(item_id)] = winner_type

    bundle = {
        "model_type": winner_type,
        "ml_model": winner_model,
        "feature_columns": preprocess.FEATURE_COLUMNS,
        "ma_window": preprocess.MA_WINDOW,
        "item_model_types": item_model_types,
    }
    model_store.save_training_artifacts(bundle, {**winner_metrics, "model_type": winner_type})

    return {**winner_metrics, "model_type": winner_type}
