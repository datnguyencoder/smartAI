from datetime import date

from pydantic import BaseModel, Field


class SalesHistoryRecord(BaseModel):
    item_id: int
    sale_date: date
    quantity: float = Field(ge=0)
    category_id: int


class TrainRequest(BaseModel):
    sales_history: list[SalesHistoryRecord] = Field(min_length=1)


class ItemRecentSales(BaseModel):
    item_id: int
    category_id: int
    recent_sales: list[SalesHistoryRecord] = Field(min_length=1)


class ForecastAllRequest(BaseModel):
    items: list[ItemRecentSales] = Field(min_length=1)


class TrainForecastRequest(BaseModel):
    sales_history: list[SalesHistoryRecord] = Field(min_length=1)
    items: list[ItemRecentSales] = Field(min_length=1)
