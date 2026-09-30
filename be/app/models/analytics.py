import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AnalyticsQueryRequest(BaseModel):
    metric: str
    timeframe: str = "7d"  # 24h, 7d, 30d, 90d
    group_by: str | None = None
    filters: dict[str, Any] = Field(default_factory=dict)


class AnalyticsDataPoint(BaseModel):
    timestamp: datetime
    value: float
    dimension: str | None = None


class AnalyticsQueryResponse(BaseModel):
    metric: str
    timeframe: str
    tenant_id: uuid.UUID
    data: list[AnalyticsDataPoint]
    summary: dict[str, Any]


class MetricSummary(BaseModel):
    metric_name: str
    current_value: float
    previous_value: float
    change_percentage: float


class MetricsOverviewResponse(BaseModel):
    tenant_id: uuid.UUID
    period: str
    metrics: list[MetricSummary]


class ExportFormat(str):
    CSV = "csv"
    JSON = "json"