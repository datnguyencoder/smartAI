from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib

SERVICE_VERSION = "1.1.0"
SAVED_MODELS_DIR = Path(__file__).resolve().parent.parent / "saved_models"
MODEL_FILENAME = "active_model.joblib"
METADATA_FILENAME = "training_metadata.json"
MAX_VERSIONED_MODELS = 3

_last_metrics: dict[str, Any] | None = None
_loaded_bundle: dict[str, Any] | None = None


def _model_path() -> Path:
    return SAVED_MODELS_DIR / MODEL_FILENAME


def _metadata_path() -> Path:
    return SAVED_MODELS_DIR / METADATA_FILENAME


def _cleanup_old_versions() -> None:
    versioned = sorted(
        SAVED_MODELS_DIR.glob("model_v*.joblib"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    for old in versioned[MAX_VERSIONED_MODELS:]:
        old.unlink(missing_ok=True)


def is_model_loaded() -> bool:
    return _loaded_bundle is not None or _model_path().exists()


def save_training_artifacts(bundle: dict[str, Any], metrics: dict[str, Any]) -> None:
    global _last_metrics, _loaded_bundle

    SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    metrics_payload = {
        **metrics,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "version": SERVICE_VERSION,
    }
    if "item_model_types" in bundle:
        metrics_payload["item_model_types"] = bundle["item_model_types"]

    versioned_path = SAVED_MODELS_DIR / f"model_v{timestamp}.joblib"
    joblib.dump(bundle, versioned_path)
    joblib.dump(bundle, _model_path())
    _metadata_path().write_text(json.dumps(metrics_payload, indent=2), encoding="utf-8")

    _cleanup_old_versions()
    _last_metrics = metrics_payload
    _loaded_bundle = bundle


def load_model_bundle() -> dict[str, Any] | None:
    global _loaded_bundle

    if _loaded_bundle is not None:
        return _loaded_bundle

    if not _model_path().exists():
        return None

    _loaded_bundle = joblib.load(_model_path())
    return _loaded_bundle


def get_last_metrics() -> dict[str, Any] | None:
    global _last_metrics

    if _last_metrics is not None:
        return _last_metrics

    if not _metadata_path().exists():
        return None

    _last_metrics = json.loads(_metadata_path().read_text(encoding="utf-8"))
    return _last_metrics
