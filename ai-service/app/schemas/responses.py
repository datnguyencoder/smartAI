from datetime import datetime

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str


class TrainResponse(BaseModel):
    mae: float
    rmse: float
    mape: float
    model_type: str


class MetricsResponse(BaseModel):
    mae: float
    rmse: float
    mape: float
    model_type: str
    trained_at: datetime | None = None


class ItemForecast(BaseModel):
    item_id: int
    predicted_qty_7d: float
    predicted_qty_14d: float
    predicted_qty_30d: float
    model_type: str


class ForecastAllResponse(BaseModel):
    forecasts: list[ItemForecast]
