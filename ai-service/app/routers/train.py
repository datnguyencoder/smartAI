from app.schemas.requests import TrainRequest
from app.schemas.responses import TrainResponse
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
    )
