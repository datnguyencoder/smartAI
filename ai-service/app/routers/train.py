from app.schemas.requests import TrainRequest
from app.schemas.responses import TrainResponse
from app.services import train as train_service

from fastapi import APIRouter

router = APIRouter(tags=["train"])


@router.post("/ai/train", response_model=TrainResponse)
def train_models(request: TrainRequest) -> TrainResponse:
    records = [record.model_dump(mode="json") for record in request.sales_history]
    result = train_service.train_from_sales_history(records)
    return TrainResponse(**result)
