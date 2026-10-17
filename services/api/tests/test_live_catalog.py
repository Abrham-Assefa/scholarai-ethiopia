from datetime import UTC, datetime

from sqlalchemy import create_engine, delete, func, select
from sqlalchemy.orm import Session

from app.db import Base, SessionLocal
from app.models import CollectorRun, Conference, Match, Reminder, Scholarship, User
from app.seed import clear_curated_catalog, prepare_live_catalog, seed


def test_live_catalog_removes_seed_data_once_then_preserves_collected_rows():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        db.add_all(
            [
                Scholarship(
                    id="seed-scholarship",
                    title="Seed scholarship",
                    country="Germany",
                    url="https://example.org/seed",
                    origin="discovered",
                ),
                Conference(id="seed-conference", title="Seed conference", origin="discovered"),
            ]
        )
        db.commit()

        prepare_live_catalog(db)

        assert db.scalar(select(func.count()).select_from(Scholarship)) == 0
        assert db.scalar(select(func.count()).select_from(Conference)) == 0

        db.add(CollectorRun(trigger="auto", status="ok"))
        db.add_all(
            [
                Scholarship(
                    id="old-static-scholarship",
                    title="Old static scholarship",
                    country="Germany",
                    url="https://example.org/static",
                    origin="curated",
                ),
                Scholarship(
                    id="live-scholarship",
                    title="Live scholarship",
                    country="Germany",
                    url="https://example.org/live",
                    origin="discovered",
                ),
                Conference(id="old-static-conference", title="Old static conference", origin="curated"),
                Conference(id="live-conference", title="Live conference", origin="discovered"),
            ]
        )
        db.commit()

        prepare_live_catalog(db)

        assert db.get(Scholarship, "old-static-scholarship") is None
        assert db.get(Conference, "old-static-conference") is None
        assert db.get(Scholarship, "live-scholarship") is not None
        assert db.get(Conference, "live-conference") is not None
    engine.dispose()


def test_live_catalog_cleanup_removes_curated_and_preserves_discovered(client):
    with SessionLocal() as db:
        curated = db.scalars(select(Scholarship).where(Scholarship.origin != "discovered").limit(1)).first()
        curated_id = curated.id
        user = User(phone="+251900000001")
        db.add(user)
        discovered = Scholarship(
            id="live-catalog-test",
            title="Live opportunity",
            country="Germany",
            url="https://example.org/opportunity",
            origin="discovered",
            status="open",
        )
        discovered_conference = Conference(
            id="live-conference-test",
            title="Live conference",
            origin="discovered",
            status="open",
        )
        curated_conference_id = db.scalar(
            select(Conference.id).where(Conference.origin != "discovered").limit(1)
        )
        db.add_all([discovered, discovered_conference])
        db.flush()
        db.add(
            Match(
                user_id=user.id,
                scholarship_id=curated_id,
                probability=80,
            )
        )
        db.add(
            Reminder(
                user_id=user.id,
                scholarship_id=curated_id,
                remind_at=datetime.now(UTC),
            )
        )
        db.commit()

        clear_curated_catalog(db)

        assert db.get(Scholarship, curated_id) is None
        assert db.get(Scholarship, discovered.id) is not None
        assert db.get(Conference, curated_conference_id) is None
        assert db.get(Conference, discovered_conference.id) is not None
        assert db.scalar(select(func.count()).select_from(Match).where(Match.scholarship_id == curated_id)) == 0
        reminder = db.scalars(select(Reminder).where(Reminder.user_id == user.id)).one()
        assert reminder.scholarship_id is None

        db.execute(delete(Reminder).where(Reminder.user_id == user.id))
        db.delete(discovered)
        db.delete(discovered_conference)
        db.delete(user)
        db.commit()
        seed(db)
