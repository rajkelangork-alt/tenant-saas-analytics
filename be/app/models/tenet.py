import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TenantBase(BaseModel):
    name: str


class TenantCreate(TenantBase):
    slug: str | None = None


class TenantUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None


class TenantResponse(TenantBase):
    id: uuid.UUID
    slug: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TenantUsageStats(BaseModel):
    tenant_id: uuid.UUID
    tenant_name: str
    total_users: int
    active_users: int
    total_dashboards: int
    total_widgets: int