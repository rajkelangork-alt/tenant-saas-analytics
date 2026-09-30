import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class WidgetBase(BaseModel):
    title: str
    widget_type: str  # line_chart, bar_chart, metric_card, pie_chart, table
    query_config: dict[str, Any] = Field(default_factory=dict)
    layout_config: dict[str, Any] = Field(default_factory=dict)


class WidgetCreate(WidgetBase):
    pass


class WidgetResponse(WidgetBase):
    id: uuid.UUID
    dashboard_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardBase(BaseModel):
    title: str
    description: str | None = None
    is_public: bool = False


class DashboardCreate(DashboardBase):
    layout: dict[str, Any] = Field(default_factory=dict)


class DashboardUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    is_public: bool | None = None


class DashboardLayoutUpdate(BaseModel):
    layout: dict[str, Any]


class DashboardShareRequest(BaseModel):
    user_ids: list[uuid.UUID]


class DashboardResponse(DashboardBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_by: uuid.UUID | None = None
    layout: dict[str, Any]
    created_at: datetime
    updated_at: datetime
    widgets: list[WidgetResponse] = []

    model_config = ConfigDict(from_attributes=True)