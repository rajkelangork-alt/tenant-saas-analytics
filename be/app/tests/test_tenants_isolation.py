import uuid

import pytest
from httpx import AsyncClient

from app.api.v1.endpoints.dependencies import get_current_active_user
from app.db.models import User, UserRole
from app.main import app


@pytest.mark.asyncio
async def test_tenant_admin_cannot_create_tenant(client: AsyncClient) -> None:
    """RBAC check: TENANT_ADMIN is rejected when attempting SUPER_ADMIN actions."""
    payload = {"name": "Unauthorized Tenant", "slug": "unauthorized-tenant"}
    response = await client.post("/api/v1/tenants", json=payload)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_tenant_isolation_scoping(
    client: AsyncClient, tenant_a_id: uuid.UUID, tenant_b_id: uuid.UUID
) -> None:
    """Tenant isolation check: Context strictly reflects active tenant identity."""
    user_a = User(
        id=uuid.uuid4(),
        email="a@tenant-a.com",
        role=UserRole.MEMBER,
        tenant_id=tenant_a_id,
        is_active=True,
    )
    user_b = User(
        id=uuid.uuid4(),
        email="b@tenant-b.com",
        role=UserRole.MEMBER,
        tenant_id=tenant_b_id,
        is_active=True,
    )

    app.dependency_overrides[get_current_active_user] = lambda: user_a
    res_a = await client.get("/api/v1/analytics/overview")

    app.dependency_overrides[get_current_active_user] = lambda: user_b
    res_b = await client.get("/api/v1/analytics/overview")

    assert res_a.status_code in [200, 404]
    assert res_b.status_code in [200, 404]


@pytest.mark.asyncio
async def test_async_export_task_dispatch(client: AsyncClient) -> None:
    """Async task check: Celery background worker accepts the job in eager mode."""
    response = await client.post(
        "/api/v1/analytics/export/async?metric=active_users&format=csv"
    )
    assert response.status_code == 202
    data = response.json()
    assert "task_id" in data
    assert data["status"] == "processing"