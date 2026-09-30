import asyncio
import uuid
from collections.abc import AsyncGenerator, Generator

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.v1.endpoints.dependencies import get_current_active_user
from app.db.models import User, UserRole
from app.db.session import engine
from app.main import app


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.run_until_complete(engine.dispose())
    loop.close()


@pytest.fixture
def tenant_a_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def tenant_b_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def mock_tenant_admin(tenant_a_id: uuid.UUID) -> User:
    return User(
        id=uuid.uuid4(),
        email="admin@tenant-a.com",
        role=UserRole.TENANT_ADMIN,
        tenant_id=tenant_a_id,
        is_active=True,
    )


@pytest.fixture
def mock_super_admin(tenant_a_id: uuid.UUID) -> User:
    return User(
        id=uuid.uuid4(),
        email="super@platform.com",
        role=UserRole.SUPER_ADMIN,
        tenant_id=tenant_a_id,
        is_active=True,
    )


@pytest.fixture
async def client(mock_tenant_admin: User) -> AsyncGenerator[AsyncClient, None]:
    # Inject active tenant admin into requests to bypass live DB lookup
    app.dependency_overrides[get_current_active_user] = lambda: mock_tenant_admin

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()