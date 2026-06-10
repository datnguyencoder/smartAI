from app.schemas.requests import ForecastAllRequest
from app.schemas.responses import ForecastAllResponse, ItemForecast
from app.services import model_store, predict as predict_service

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["forecast"])


@router.post("/ai/forecast/all", response_model=ForecastAllResponse)
def forecast_all(request: ForecastAllRequest) -> ForecastAllResponse:
    if not model_store.is_model_loaded():
        raise HTTPException(
            status_code=503,
            detail="No trained model available; forecast will use moving_average after train",
        )
    payload = [
        {
            "item_id": item.item_id,
            "category_id": item.category_id,
            "recent_sales": [record.model_dump(mode="json") for record in item.recent_sales],
        }
        for item in request.items
    ]
    results = predict_service.forecast_all_items(payload)
    return ForecastAllResponse(forecasts=[ItemForecast(**row) for row in results])
