from datetime import date

from app.services import preprocess


def test_build_features_creates_lag_and_calendar_columns():
    records = [
        {"item_id": 1, "sale_date": date(2026, 1, d), "quantity": float(d), "category_id": 10}
        for d in range(1, 16)
    ]
    raw = preprocess.sales_records_to_dataframe(records)
    filled = preprocess.fill_missing_dates(raw)
    featured = preprocess.build_features(filled)

    assert not featured.empty
    for column in preprocess.FEATURE_COLUMNS:
        assert column in featured.columns

    last_row = featured.iloc[-1]
    assert last_row["sales_lag_1"] == 14.0
    assert last_row["day_of_month"] == 15.0
    assert last_row["category_id"] == 10.0


def test_moving_average_forecast_is_non_negative():
    history = [1.0, 2.0, 3.0, 4.0, 5.0]
    predictions = preprocess.moving_average_daily_forecast(history, horizon=3, window=3)

    assert len(predictions) == 3
    assert all(value >= 0 for value in predictions)
