from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from app.routers import forecast, health, metrics, train
from app.services import model_store

app = FastAPI(
    title="SmartMart AI Service",
    version=model_store.SERVICE_VERSION,
    description="Internal ML service for SmartMart demand forecasting.",
    docs_url="/ai/docs",
    redoc_url="/ai/redoc",
    openapi_url="/ai/openapi.json",
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error_code": "VALIDATION_FAILED",
            "message": "Invalid request payload",
            "errors": exc.errors(),
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    message = str(exc.detail) if exc.detail else "Request failed"
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": "AI_SERVICE_ERROR",
            "message": message,
        },
    )


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {"service": "smartmart-ai", "health": "/ai/health"}

app.include_router(health.router)
app.include_router(train.router)
app.include_router(forecast.router)
app.include_router(metrics.router)


@app.get("/metrics", include_in_schema=False)
def prometheus_metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
