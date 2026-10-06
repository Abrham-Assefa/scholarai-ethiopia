from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select

from .config import settings
from .db import SessionLocal, init_db
from .deps import get_router
from .models import Scholarship
from .routers import ai, auth, catalog, cv, me
from .seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    with SessionLocal() as db:
        if not db.scalar(select(func.count()).select_from(Scholarship)):
            seed(db)
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="API for ScholarAI Ethiopia — scholarships, matching, CV maker, chat assistant.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

for r in (auth.router, catalog.router, me.router, cv.router, ai.router):
    app.include_router(r)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "env": settings.env, "llmProvider": get_router().active_provider}
