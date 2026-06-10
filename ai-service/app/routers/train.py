from app.schemas.requests import TrainForecastRequest, TrainRequest
from app.schemas.responses import TrainAndForecastResponse, TrainResponse
from app.services import predict as predict_service
from app.services import train as train_service

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["train"])


@router.post("/ai/train", response_model=TrainResponse)
def train_models(request: TrainRequest) -> TrainResponse:
    records = [record.model_dump(mode="json") for record in request.sales_history]
    try:
        result = train_service.train_from_sales_history(records)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return TrainResponse(
        mae=result["mae"],
        rmse=result["rmse"],
        mape=result["mape"],
        model_type=result["model_type"],
        training_samples=result.get("training_samples", 0),
        n_items_ml=result.get("n_items_ml", 0),
        n_items_ma=result.get("n_items_ma", 0),
        item_model_types=result.get("item_model_types", {}),
    )


@router.post("/ai/train-and-forecast", response_model=TrainAndForecastResponse)
def train_and_forecast(request: TrainForecastRequest) -> TrainAndForecastResponse:
    records = [record.model_dump(mode="json") for record in request.sales_history]
    try:
        train_result = train_service.train_from_sales_history(records)
        items_payload = [
            {
                "item_id": item.item_id,
                "category_id": item.category_id,
                "recent_sales": [r.model_dump(mode="json") for r in item.recent_sales],
            }
            for item in request.items
        ]
        forecasts = predict_service.forecast_all_items(items_payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return TrainAndForecastResponse(
        mae=train_result["mae"],
        rmse=train_result["rmse"],
        mape=train_result["mape"],
        model_type=train_result["model_type"],
        training_samples=train_result.get("training_samples", 0),
        n_items_ml=train_result.get("n_items_ml", 0),
        n_items_ma=train_result.get("n_items_ma", 0),
        item_model_types=train_result.get("item_model_types", {}),
        forecasts=forecasts,
    )
