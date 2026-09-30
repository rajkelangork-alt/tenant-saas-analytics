import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool, text

# Root directory pathing
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.config import settings
from app.db.base import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # Convert asyncpg connection string to standard psycopg/sync for Alembic
    sync_url = str(settings.DATABASE_URL)
    if "+asyncpg" in sync_url:
        sync_url = sync_url.replace("+asyncpg", "")
    if sync_url.startswith("postgres://"):
        sync_url = sync_url.replace("postgres://", "postgresql://", 1)

    connectable = create_engine(
        sync_url,
        poolclass=pool.NullPool,
        connect_args={"options": "-csearch_path=tenant_analytics"},
    )

    with connectable.connect() as connection:
        connection.execute(text("CREATE SCHEMA IF NOT EXISTS tenant_analytics;"))
        connection.execute(text("SET search_path TO tenant_analytics;"))
        connection.commit()

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            version_table_schema="tenant_analytics",
            version_table="alembic_version",
            include_schemas=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    pass
else:
    run_migrations_online()