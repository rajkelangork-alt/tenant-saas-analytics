from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.dependencies import get_current_active_user
from app.db.models import User
from app.db.session import get_db
from app.models.analytics import (
    AnalyticsQueryRequest,
    AnalyticsQueryResponse,
    MetricsOverviewResponse,
)
from app.services.analytics_service import AnalyticsService
from app.workers.analytics_tasks import generate_export_archive

router = APIRouter(prefix="/analytics", tags=["Analytics"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
ActiveUser = Annotated[User, Depends(get_current_active_user)]


@router.get("/overview", response_model=MetricsOverviewResponse)
async def get_overview(
    current_user: ActiveUser,
    db: DbSession,
) -> MetricsOverviewResponse:
    return await AnalyticsService.get_overview_metrics(db, current_user.tenant_id)


@router.post("/query", response_model=AnalyticsQueryResponse)
async def query_metrics(
    query_in: AnalyticsQueryRequest,
    current_user: ActiveUser,
    db: DbSession,
) -> AnalyticsQueryResponse:
    return await AnalyticsService.query_analytics(db, current_user.tenant_id, query_in)


@router.get("/export")
async def export_metrics(
    current_user: ActiveUser,
    db: DbSession,
    metric: str = Query(default="active_users"),
    format: str = Query(default="csv", pattern="^(csv|json)$"),
) -> Response:
    content, media_type = await AnalyticsService.export_data(
        db, current_user.tenant_id, metric, format
    )
    filename = f"analytics_{metric}_{current_user.tenant_id}.{format}"
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/export/async", status_code=status.HTTP_202_ACCEPTED)
async def trigger_async_export(
    current_user: ActiveUser,
    metric: str = Query(default="active_users"),
    format: str = Query(default="csv", pattern="^(csv|json)$"),
) -> dict[str, Any]:
    task = generate_export_archive.delay(
        str(current_user.tenant_id), metric, format
    )
    return {
        "message": "Export task scheduled successfully",
        "task_id": task.id,
        "status": "processing",
    }