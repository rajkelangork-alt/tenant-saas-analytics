import logging
import time

from app.workers.celery_app import celery_app

logger = logging.getLogger("celery.tasks")


@celery_app.task(name="tasks.aggregate_daily_metrics")
def aggregate_daily_metrics(tenant_id: str) -> dict[str, str]:
    logger.info("Aggregating metrics for tenant: %s", tenant_id)
    time.sleep(2)
    return {"status": "success", "tenant_id": tenant_id}


@celery_app.task(name="tasks.generate_export_archive")
def generate_export_archive(
    tenant_id: str, metric: str, export_format: str
) -> dict[str, str]:
    logger.info(
        "Generating %s export for %s (tenant: %s)", export_format, metric, tenant_id
    )
    time.sleep(3)
    return {
        "status": "ready",
        "download_url": f"/static/exports/{tenant_id}_{metric}.{export_format}",
    }