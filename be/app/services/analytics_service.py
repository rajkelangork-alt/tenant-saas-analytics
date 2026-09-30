import csv
import io
import json
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Dashboard, User
from app.models.analytics import (
    AnalyticsDataPoint,
    AnalyticsQueryRequest,
    AnalyticsQueryResponse,
    MetricsOverviewResponse,
    MetricSummary,
)


class AnalyticsService:
    @staticmethod
    async def get_overview_metrics(
        db: AsyncSession, tenant_id: uuid.UUID
    ) -> MetricsOverviewResponse:
        total_users = await db.scalar(
            select(func.count(User.id)).where(User.tenant_id == tenant_id)
        ) or 0
        total_dashboards = await db.scalar(
            select(func.count(Dashboard.id)).where(Dashboard.tenant_id == tenant_id)
        ) or 0

        metrics = [
            MetricSummary(
                metric_name="total_users",
                current_value=float(total_users),
                previous_value=max(0.0, float(total_users) - 1),
                change_percentage=10.0 if total_users > 0 else 0.0,
            ),
            MetricSummary(
                metric_name="total_dashboards",
                current_value=float(total_dashboards),
                previous_value=max(0.0, float(total_dashboards) - 1),
                change_percentage=15.0 if total_dashboards > 0 else 0.0,
            ),
            MetricSummary(
                metric_name="active_sessions",
                current_value=float(total_users),
                previous_value=float(total_users),
                change_percentage=0.0,
            ),
        ]

        return MetricsOverviewResponse(
            tenant_id=tenant_id,
            period="last_30_days",
            metrics=metrics,
        )

    @staticmethod
    async def query_analytics(
        db: AsyncSession, tenant_id: uuid.UUID, query_in: AnalyticsQueryRequest
    ) -> AnalyticsQueryResponse:
        now = datetime.now(timezone.utc)
        points: list[AnalyticsDataPoint] = []

        # Synthetic trend aggregation based on timeframe
        days = 7 if query_in.timeframe == "7d" else 30
        for i in range(days, 0, -1):
            point_time = now - timedelta(days=i)
            points.append(
                AnalyticsDataPoint(
                    timestamp=point_time,
                    value=round(10.0 + (i * 1.5), 2),
                    dimension=query_in.group_by or "default",
                )
            )

        total_value = sum(p.value for p in points)
        avg_value = round(total_value / len(points), 2) if points else 0.0

        return AnalyticsQueryResponse(
            metric=query_in.metric,
            timeframe=query_in.timeframe,
            tenant_id=tenant_id,
            data=points,
            summary={"count": len(points), "total": total_value, "average": avg_value},
        )

    @staticmethod
    async def export_data(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        metric: str,
        export_format: str,
    ) -> tuple[str, str]:
        query_req = AnalyticsQueryRequest(metric=metric, timeframe="30d")
        result = await AnalyticsService.query_analytics(db, tenant_id, query_req)

        if export_format.lower() == "csv":
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["timestamp", "value", "dimension"])
            for row in result.data:
                writer.writerow([row.timestamp.isoformat(), row.value, row.dimension])
            return output.getvalue(), "text/csv"

        json_data = [
            {"timestamp": row.timestamp.isoformat(), "value": row.value, "dimension": row.dimension}
            for row in result.data
        ]
        return json.dumps(json_data, indent=2), "application/json"