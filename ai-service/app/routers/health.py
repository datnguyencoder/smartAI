from app.services import model_store
from app.schemas.responses import HealthResponse

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/ai/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model_loaded=model_store.is_model_loaded(),
        version=model_store.SERVICE_VERSION,
    )
