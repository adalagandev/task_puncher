"""FastAPI application entry point."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import milestones, tasks, weekly
from app.core.config import settings
from app.core.db import SessionLocal, init_db
from app.seed import ensure_default_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        ensure_default_user(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Task Puncher", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(milestones.router)
app.include_router(weekly.router)


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
