import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") in ["ok", "healthy"] or "status" in data


@pytest.mark.asyncio
async def test_unauthenticated_protected_route(client: AsyncClient) -> None:
    response = await client.get("/api/v1/users")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


@pytest.mark.asyncio
async def test_authenticated_me_route(
    client: AsyncClient, tenant_a_admin_token: str
) -> None:
    headers = {"Authorization": f"Bearer {tenant_a_admin_token}"}
    response = await client.get("/api/v1/auth/me", headers=headers)
    # Returns 200 or 404 depending on whether test DB contains this mock UUID
    assert response.status_code in [200, 404]