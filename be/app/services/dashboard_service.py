import uuid
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Dashboard
from app.models.dashboard import (
    DashboardCreate,
    DashboardLayoutUpdate,
    DashboardShareRequest,
    DashboardUpdate,
)


class DashboardService:
    @staticmethod
    async def list_dashboards(
        db: AsyncSession,
        tenant_id: uuid.UUID,
    ) -> list[Dashboard]:
        query = select(Dashboard).where(Dashboard.tenant_id == tenant_id)
        if hasattr(Dashboard, "widgets"):
            query = query.options(selectinload(Dashboard.widgets))
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def create_dashboard(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        dashboard_in: DashboardCreate,
    ) -> Dashboard:
        params: dict[str, Any] = {
            "tenant_id": tenant_id,
            "title": dashboard_in.title,
            "description": dashboard_in.description,
            "is_public": dashboard_in.is_public,
            "layout": dashboard_in.layout,
        }

        # Dynamically map the user ID to the column defined on your model
        if hasattr(Dashboard, "user_id"):
            params["user_id"] = user_id
        elif hasattr(Dashboard, "created_by_id"):
            params["created_by_id"] = user_id
        elif hasattr(Dashboard, "created_by"):
            params["created_by"] = user_id

        new_dashboard = Dashboard(**params)
        db.add(new_dashboard)
        await db.commit()

        query = select(Dashboard).where(Dashboard.id == new_dashboard.id)
        if hasattr(Dashboard, "widgets"):
            query = query.options(selectinload(Dashboard.widgets))
        created = await db.scalar(query)
        return created or new_dashboard

    @staticmethod
    async def get_dashboard_by_id(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        dashboard_id: uuid.UUID,
    ) -> Dashboard:
        query = select(Dashboard).where(
            Dashboard.id == dashboard_id, Dashboard.tenant_id == tenant_id
        )
        if hasattr(Dashboard, "widgets"):
            query = query.options(selectinload(Dashboard.widgets))
        dashboard = await db.scalar(query)
        if not dashboard:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dashboard not found.",
            )
        return dashboard

    @staticmethod
    async def update_dashboard(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        dashboard_id: uuid.UUID,
        dashboard_in: DashboardUpdate,
    ) -> Dashboard:
        dashboard = await DashboardService.get_dashboard_by_id(db, tenant_id, dashboard_id)
        update_data = dashboard_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(dashboard, field, value)
        await db.commit()
        return await DashboardService.get_dashboard_by_id(db, tenant_id, dashboard_id)

    @staticmethod
    async def update_layout(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        dashboard_id: uuid.UUID,
        layout_in: DashboardLayoutUpdate,
    ) -> Dashboard:
        dashboard = await DashboardService.get_dashboard_by_id(db, tenant_id, dashboard_id)
        dashboard.layout = layout_in.layout
        await db.commit()
        return await DashboardService.get_dashboard_by_id(db, tenant_id, dashboard_id)

    @staticmethod
    async def delete_dashboard(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        dashboard_id: uuid.UUID,
    ) -> None:
        dashboard = await DashboardService.get_dashboard_by_id(db, tenant_id, dashboard_id)
        await db.delete(dashboard)
        await db.commit()

    @staticmethod
    async def share_dashboard(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        dashboard_id: uuid.UUID,
        share_in: DashboardShareRequest,
    ) -> dict[str, Any]:
        dashboard = await DashboardService.get_dashboard_by_id(db, tenant_id, dashboard_id)
        current_layout = dict(dashboard.layout) if dashboard.layout else {}
        current_layout["shared_with"] = [str(uid) for uid in share_in.user_ids]
        dashboard.layout = current_layout
        await db.commit()
        return {"message": "Dashboard shared successfully", "shared_with": share_in.user_ids}