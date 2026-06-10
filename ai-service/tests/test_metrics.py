from datetime import date, timedelta

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _sample_sales(days: int = 40) -> list[dict]:
    base = date.today() - timedelta(days=days)
    return [
        {
            "item_id": 1,
            "sale_date": (base + timedelta(days=i)).isoformat(),
            "quantity": 10.0 + (i % 5),
            "category_id": 1,
        }
        for i in range(days)
    ]


def test_metrics_includes_item_model_types():
    client.post("/ai/train", json={"sales_history": _sample_sales()})
    res = client.get("/ai/model/metrics")
    assert res.status_code == 200
    body = res.json()
    assert "item_model_types" in body
    assert "1" in body["item_model_types"]
