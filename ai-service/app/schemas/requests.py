from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class SalesHistoryRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    item_id: int = Field(gt=0)
    sale_date: date
    quantity: float = Field(ge=0)
    category_id: int = Field(gt=0)


class TrainRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sales_history: list[SalesHistoryRecord] = Field(min_length=1)


class ItemRecentSales(BaseModel):
    model_config = ConfigDict(extra="forbid")

    item_id: int = Field(gt=0)
    category_id: int = Field(gt=0)
    recent_sales: list[SalesHistoryRecord] = Field(default_factory=list)


class ForecastAllRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ItemRecentSales] = Field(min_length=1)


class TrainForecastRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sales_history: list[SalesHistoryRecord] = Field(min_length=1)
    items: list[ItemRecentSales] = Field(min_length=1)
