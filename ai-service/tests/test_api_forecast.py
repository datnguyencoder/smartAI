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


def test_health():
    res = client.get("/ai/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] in ("ok", "healthy", "up") or "status" in body


def test_train_and_forecast_all():
    train_res = client.post("/ai/train", json={"sales_history": _sample_sales()})
    assert train_res.status_code == 200
    train_body = train_res.json()
    assert "mae" in train_body
    assert train_body["model_type"]

    forecast_res = client.post(
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
    assert forecast_res.status_code == 200
    data = forecast_res.json()
    assert len(data["forecasts"]) == 1
    row = data["forecasts"][0]
    assert row["predicted_qty_7d"] >= 0
    assert "daily_series" in row
    assert len(row["daily_series"]) > 0
    assert "date" in row["daily_series"][0]
