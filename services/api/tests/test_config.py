from app.config import Settings


def test_postgres_urls_use_psycopg_driver():
    assert (
        Settings(_env_file=None, database_url="postgres://user:pass@host/db").database_url
        == "postgresql+psycopg://user:pass@host/db"
    )
    assert (
        Settings(_env_file=None, database_url="postgresql://user:pass@host/db").database_url
        == "postgresql+psycopg://user:pass@host/db"
    )


def test_sqlite_database_url_is_unchanged():
    url = "sqlite:////tmp/scholarai.db"
    assert Settings(_env_file=None, database_url=url).database_url == url
