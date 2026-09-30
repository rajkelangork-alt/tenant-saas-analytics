import asyncio
import uuid

from app.core.security import get_password_hash
from app.db.models import Tenant, User, UserRole
from app.db.session import engine
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def seed():
    async with AsyncSession(engine) as session:
        # 1. Ensure Tenant exists
        result = await session.execute(select(Tenant).where(Tenant.slug == "tenant-1"))
        tenant = result.scalar_one_or_none()
        if not tenant:
            tenant = Tenant(
                id=uuid.uuid4(),
                name="Acme Corp",
                slug="tenant-1",
                is_active=True
            )
            session.add(tenant)
            await session.flush()
            print(f"Created Tenant: {tenant.name} ({tenant.id})")
        else:
            print(f"Found existing Tenant: {tenant.name}")

        # 2. Ensure User exists
        user_result = await session.execute(
            select(User).where(User.email == "admin@tenant1.com")
        )
        user = user_result.scalar_one_or_none()
        if not user:
            user = User(
                tenant_id=tenant.id,
                email="admin@tenant1.com",
                hashed_password=get_password_hash("Admin@12345"),
                full_name="Admin User",
                role=UserRole.TENANT_ADMIN,
                auth_provider="LOCAL",
                is_active=True,
            )
            session.add(user)
            await session.commit()
            print("Created Admin User: admin@tenant1.com with password: Admin@12345")
        else:
            user.hashed_password = get_password_hash("Admin@12345")
            user.is_active = True
            await session.commit()
            print("Updated existing Admin User password to: Admin@12345")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())