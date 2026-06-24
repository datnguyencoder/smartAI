from datetime import datetime

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str


class TrainResponse(BaseModel):
    mae: float
    rmse: float
    mape: float
    model_type: str
    training_samples: int = 0
    n_items_ml: int = 0
    n_items_ma: int = 0
    item_model_types: dict[str, str] = Field(default_factory=dict)


class MetricsResponse(BaseModel):
    mae: float
    rmse: float
    mape: float
    model_type: str
    trained_at: datetime | None = None
    item_model_types: dict[str, str] = Field(default_factory=dict)
    training_samples: int = 0
    n_items_ml: int = 0
    n_items_ma: int = 0


class DailyForecastPoint(BaseModel):
    date: str
    predicted_qty: float


class ItemForecast(BaseModel):
    item_id: int
    predicted_qty_7d: float
    predicted_qty_14d: float
    predicted_qty_30d: float
    model_type: str
    confidence_low: float = 0.0
    confidence_high: float = 0.0
    daily_series: list[DailyForecastPoint] = Field(default_factory=list)


class ForecastAllResponse(BaseModel):
    forecasts: list[ItemForecast]


class TrainAndForecastResponse(BaseModel):
    mae: float
    rmse: float
    mape: float
    model_type: str
    training_samples: int = 0
    n_items_ml: int = 0
    n_items_ma: int = 0
    item_model_types: dict[str, str] = Field(default_factory=dict)
    forecasts: list[ItemForecast] = Field(default_factory=list)
