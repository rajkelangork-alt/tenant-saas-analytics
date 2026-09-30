import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.dependencies import (
    RoleChecker,
    get_current_active_user,
)
from app.db.models import Tenant, User, UserRole
from app.db.session import get_db
from app.models.tenet import (  # Adjust import to 'tenants' if renamed
    TenantCreate,
    TenantResponse,
    TenantUpdate,
    TenantUsageStats,
)
from app.services.tenant_service import TenantService

router = APIRouter(prefix="/tenants", tags=["Tenants"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
ActiveUser = Annotated[User, Depends(get_current_active_user)]
RequireSuperAdmin = Annotated[User, Depends(RoleChecker([UserRole.SUPER_ADMIN]))]
RequireTenantAdmin = Annotated[
    User,
    Depends(RoleChecker([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN])),
]


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_in: TenantCreate,
    _: RequireSuperAdmin,
    db: DbSession,
) -> Tenant:
    return await TenantService.create_tenant(db, tenant_in)


@router.get("/usage/stats", response_model=TenantUsageStats)
async def get_tenant_usage_stats(
    current_user: RequireTenantAdmin,
    db: DbSession,
) -> TenantUsageStats:
    return await TenantService.get_usage_stats(db, current_user.tenant_id)


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: uuid.UUID,
    current_user: ActiveUser,
    db: DbSession,
) -> Tenant:
    return await TenantService.get_tenant_by_id(db, tenant_id)


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: uuid.UUID,
    tenant_in: TenantUpdate,
    _: RequireTenantAdmin,
    db: DbSession,
) -> Tenant:
    return await TenantService.update_tenant(db, tenant_id, tenant_in)