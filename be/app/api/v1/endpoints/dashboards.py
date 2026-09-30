import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.dependencies import (
    RoleChecker,
    get_current_active_user,
)
from app.db.models import User, UserRole
from app.db.session import get_db
from app.models.dashboard import (
    DashboardCreate,
    DashboardLayoutUpdate,
    DashboardResponse,
    DashboardShareRequest,
    DashboardUpdate,
)
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
ActiveUser = Annotated[User, Depends(get_current_active_user)]
RequireEditorOrAbove = Annotated[
    User,
    Depends(
        RoleChecker(
            [
                UserRole.SUPER_ADMIN,
                UserRole.TENANT_ADMIN,
                getattr(UserRole, "EDITOR", UserRole.TENANT_ADMIN),
                getattr(UserRole, "MEMBER", UserRole.TENANT_ADMIN),
            ]
        )
    ),
]


@router.get("", response_model=list[DashboardResponse])
async def list_dashboards(
    current_user: ActiveUser,
    db: DbSession,
) -> Any:
    return await DashboardService.list_dashboards(db, current_user.tenant_id)


@router.post("", response_model=DashboardResponse, status_code=status.HTTP_201_CREATED)
async def create_dashboard(
    dashboard_in: DashboardCreate,
    current_user: RequireEditorOrAbove,
    db: DbSession,
) -> Any:
    return await DashboardService.create_dashboard(
        db, current_user.tenant_id, current_user.id, dashboard_in
    )


@router.get("/{dashboard_id}", response_model=DashboardResponse)
async def get_dashboard(
    dashboard_id: uuid.UUID,
    current_user: ActiveUser,
    db: DbSession,
) -> Any:
    return await DashboardService.get_dashboard_by_id(
        db, current_user.tenant_id, dashboard_id
    )


@router.put("/{dashboard_id}", response_model=DashboardResponse)
async def update_dashboard(
    dashboard_id: uuid.UUID,
    dashboard_in: DashboardUpdate,
    current_user: RequireEditorOrAbove,
    db: DbSession,
) -> Any:
    return await DashboardService.update_dashboard(
        db, current_user.tenant_id, dashboard_id, dashboard_in
    )


@router.put("/{dashboard_id}/layout", response_model=DashboardResponse)
async def save_dashboard_layout(
    dashboard_id: uuid.UUID,
    layout_in: DashboardLayoutUpdate,
    current_user: RequireEditorOrAbove,
    db: DbSession,
) -> Any:
    return await DashboardService.update_layout(
        db, current_user.tenant_id, dashboard_id, layout_in
    )


@router.post("/{dashboard_id}/share")
async def share_dashboard(
    dashboard_id: uuid.UUID,
    share_in: DashboardShareRequest,
    current_user: RequireEditorOrAbove,
    db: DbSession,
) -> dict[str, Any]:
    return await DashboardService.share_dashboard(
        db, current_user.tenant_id, dashboard_id, share_in
    )


@router.delete("/{dashboard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dashboard(
    dashboard_id: uuid.UUID,
    current_user: RequireEditorOrAbove,
    db: DbSession,
) -> None:
    await DashboardService.delete_dashboard(db, current_user.tenant_id, dashboard_id)