from fastapi import FastAPI

from app.routers import forecast, health, metrics, train
from app.services import model_store

app = FastAPI(title="SmartMart AI Service", version=model_store.SERVICE_VERSION)

app.include_router(health.router)
app.include_router(train.router)
app.include_router(forecast.router)
app.include_router(metrics.router)
