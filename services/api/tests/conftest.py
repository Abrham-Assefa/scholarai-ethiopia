import os
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite://"  # in-memory
os.environ["LLM_PROVIDER"] = "mock"
os.environ["STORAGE_DIR"] = str(Path(__file__).parent / ".storage")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app import db as dbmod  # noqa: E402
from app.main import app  # noqa: E402

# In-memory SQLite must share one connection across sessions.
dbmod.engine = dbmod.create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
dbmod.SessionLocal.configure(bind=dbmod.engine)


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def auth(client):
    r = client.post("/v1/auth/otp/verify", json={"phone": "+251911000000", "code": "123456"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['accessToken']}"}
