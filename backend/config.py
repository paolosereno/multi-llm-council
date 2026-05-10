"""Configuration for the LLM Council."""

import os
import json
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

COUNCIL_MODELS = [
    "inclusionai/ring-2.6-1t:free",
    "baidu/qianfan-ocr-fast:free",
    "minimax/minimax-m2.5:free",
]

CHAIRMAN_MODEL = "x-ai/grok-4.1-fast"

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

MODEL_TIMEOUT = 60   # seconds: httpx timeout per individual model request
STAGE_TIMEOUT = 90   # seconds: asyncio.wait_for safety cap per stage

DATA_DIR = "data/conversations"

_runtime_config = None


def _config_path():
    return os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "data", "council_config.json"
    )


def get_runtime_config():
    global _runtime_config
    if _runtime_config is None:
        path = _config_path()
        if os.path.exists(path):
            with open(path) as f:
                _runtime_config = json.load(f)
        else:
            _runtime_config = {
                "council_models": list(COUNCIL_MODELS),
                "chairman_model": CHAIRMAN_MODEL,
                "fast_models": [],
                "budget_models": [],
            }
        _runtime_config.setdefault("fast_models", [])
        _runtime_config.setdefault("budget_models", [])
    return _runtime_config


def update_runtime_config(
    council_models: list,
    chairman_model: str,
    fast_models: list | None = None,
    budget_models: list | None = None,
) -> dict:
    global _runtime_config
    _runtime_config = {
        "council_models": council_models,
        "chairman_model": chairman_model,
        "fast_models": fast_models if fast_models is not None else [],
        "budget_models": budget_models if budget_models is not None else [],
    }
    path = _config_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(_runtime_config, f, indent=2)
    return _runtime_config
