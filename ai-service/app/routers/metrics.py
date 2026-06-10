from datetime import datetime

from app.schemas.responses import MetricsResponse
from app.services import model_store

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["metrics"])


@router.get("/ai/model/metrics", response_model=MetricsResponse)
def get_model_metrics() -> MetricsResponse:
    metrics = model_store.get_last_metrics()
    if metrics is None:
        raise HTTPException(status_code=404, detail="No training metrics available")

    trained_at = metrics.get("trained_at")
    if isinstance(trained_at, str):
        trained_at = datetime.fromisoformat(trained_at)

    item_types = metrics.get("item_model_types", {})
    if not item_types:
        bundle = model_store.load_model_bundle()
        if bundle:
            item_types = bundle.get("item_model_types", {})

    return MetricsResponse(
        mae=float(metrics["mae"]),
        rmse=float(metrics["rmse"]),
        mape=float(metrics["mape"]),
        model_type=str(metrics["model_type"]),
        trained_at=trained_at,
        item_model_types={str(k): str(v) for k, v in item_types.items()},
        training_samples=int(metrics.get("training_samples", 0)),
        n_items_ml=int(metrics.get("n_items_ml", 0)),
        n_items_ma=int(metrics.get("n_items_ma", 0)),
    )
