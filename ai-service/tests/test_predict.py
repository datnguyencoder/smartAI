from datetime import date, timedelta

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _sample_sales(item_id: int = 1, days: int = 40) -> list[dict]:
    base = date.today() - timedelta(days=days)
    return [
        {
            "item_id": item_id,
            "sale_date": (base + timedelta(days=i)).isoformat(),
            "quantity": 10.0 + (i % 5),
            "category_id": 1,
        }
        for i in range(days)
    ]


def test_forecast_daily_series_length_and_format():
    client.post("/ai/train", json={"sales_history": _sample_sales()})
    res = client.post(
        "/ai/forecast/all",
        json={
            "items": [
                {
                    "item_id": 1,
                    "category_id": 1,
                    "recent_sales": _sample_sales(1, 35),
                }
            ]
        },
    )
    assert res.status_code == 200
    row = res.json()["forecasts"][0]
    assert len(row["daily_series"]) == 30
    assert "date" in row["daily_series"][0]
    assert "predicted_qty" in row["daily_series"][0]


def test_forecast_without_model_returns_503():
    from app.services import model_store

    model_store._loaded_bundle = None
    model_store._last_metrics = None
    path = model_store._model_path()
    meta = model_store._metadata_path()
    if path.exists():
        path.unlink()
    if meta.exists():
        meta.unlink()

    res = client.post(
        "/ai/forecast/all",
        json={
            "items": [
                {
                    "item_id": 1,
                    "category_id": 1,
                    "recent_sales": _sample_sales(1, 10),
                }
            ]
        },
    )
    assert res.status_code == 503
