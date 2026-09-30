import re
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Dashboard, Tenant, User, Widget
from app.models.tenet import (  # Adjust import to 'tenants' if renamed
    TenantCreate,
    TenantUpdate,
    TenantUsageStats,
)


def generate_slug(name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]+", "-", name.strip().lower()).strip("-")


class TenantService:
    @staticmethod
    async def create_tenant(db: AsyncSession, tenant_in: TenantCreate) -> Tenant:
        slug = tenant_in.slug or generate_slug(tenant_in.name)
        existing = await db.scalar(select(Tenant).where(Tenant.slug == slug))
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant slug already exists.",
            )

        new_tenant = Tenant(name=tenant_in.name, slug=slug, is_active=True)
        db.add(new_tenant)
        await db.commit()
        await db.refresh(new_tenant)
        return new_tenant

    @staticmethod
    async def get_tenant_by_id(db: AsyncSession, tenant_id: uuid.UUID) -> Tenant:
        tenant = await db.get(Tenant, tenant_id)
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found.",
            )
        return tenant

    @staticmethod
    async def update_tenant(
        db: AsyncSession, tenant_id: uuid.UUID, tenant_in: TenantUpdate
    ) -> Tenant:
        tenant = await TenantService.get_tenant_by_id(db, tenant_id)
        update_data = tenant_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(tenant, field, value)
        await db.commit()
        await db.refresh(tenant)
        return tenant

    @staticmethod
    async def get_usage_stats(db: AsyncSession, tenant_id: uuid.UUID) -> TenantUsageStats:
        tenant = await TenantService.get_tenant_by_id(db, tenant_id)

        total_users = await db.scalar(
            select(func.count(User.id)).where(User.tenant_id == tenant_id)
        ) or 0

        active_users = await db.scalar(
            select(func.count(User.id)).where(
                User.tenant_id == tenant_id, User.is_active.is_(True)
            )
        ) or 0

        total_dashboards = await db.scalar(
            select(func.count(Dashboard.id)).where(Dashboard.tenant_id == tenant_id)
        ) or 0

        total_widgets = await db.scalar(
            select(func.count(Widget.id))
            .join(Dashboard, Widget.dashboard_id == Dashboard.id)
            .where(Dashboard.tenant_id == tenant_id)
        ) or 0

        return TenantUsageStats(
            tenant_id=tenant.id,
            tenant_name=tenant.name,
            total_users=total_users,
            active_users=active_users,
            total_dashboards=total_dashboards,
            total_widgets=total_widgets,
        )