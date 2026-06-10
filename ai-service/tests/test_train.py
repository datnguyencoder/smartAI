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


def test_train_empty_payload_returns_400():
    res = client.post("/ai/train", json={"sales_history": []})
    assert res.status_code == 422


def test_train_ma_only_when_short_history():
    res = client.post("/ai/train", json={"sales_history": _sample_sales(days=10)})
    assert res.status_code == 200
    body = res.json()
    assert body["model_type"] == "moving_average"


def test_train_per_sku_with_enough_history():
    history = _sample_sales(item_id=1, days=45) + _sample_sales(item_id=2, days=45)
    res = client.post("/ai/train", json={"sales_history": history})
    assert res.status_code == 200
    body = res.json()
    assert body["model_type"] in ("random_forest", "xgboost", "moving_average")

    metrics = client.get("/ai/model/metrics")
    assert metrics.status_code == 200
    assert "item_model_types" in metrics.json()
