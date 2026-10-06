import asyncio
import contextlib
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from .collector import scheduler
from .config import settings
from .db import SessionLocal, init_db
from .deps import get_router
from .routers import ai, auth, catalog, collector, cv, me
from .seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    with SessionLocal() as db:
        # Idempotent upsert keeps the DB in sync with data/seed/*.json on every boot.
        seed(db)
    task = asyncio.create_task(scheduler()) if settings.collector_enabled else None
    yield
    if task:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


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

for r in (auth.router, catalog.router, me.router, cv.router, ai.router, collector.router):
    app.include_router(r)


@app.get("/", tags=["meta"], include_in_schema=False)
def root():
    return {
        "name": settings.app_name,
        "docs": "/docs",
        "health": "/health",
        "scholarships": "/v1/scholarships",
        "web": settings.cors_list[0] if settings.cors_list else None,
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "env": settings.env, "llmProvider": get_router().active_provider}
