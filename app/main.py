from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.routers.api import router as api_router
from app.sheets import start_retry_worker
from app.store import ensure_store

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

ensure_store()
# Background Sheets retry is for long-running local servers, not serverless.
if os.getenv("VERCEL") != "1":
    start_retry_worker()

app = FastAPI(title="alaia fun", version="1.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)

static_dir = ROOT / "static"
try:
    static_dir.mkdir(exist_ok=True)
except OSError:
    pass
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/")
def index() -> FileResponse:
    return FileResponse(static_dir / "index.html")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
