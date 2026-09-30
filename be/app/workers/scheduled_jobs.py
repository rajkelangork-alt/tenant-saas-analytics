from celery.schedules import crontab  # type: ignore[import-untyped]

from app.workers.celery_app import celery_app

celery_app.conf.beat_schedule = {
    "nightly-tenant-metric-rollup": {
        "task": "tasks.aggregate_daily_metrics",
        "schedule": crontab(hour=0, minute=0),  # Midnight UTC every night
        "args": ("all_tenants",),
    },
    "hourly-cache-warmup": {
        "task": "tasks.aggregate_daily_metrics",
        "schedule": crontab(minute=0),  # Top of every hour
        "args": ("system_overview",),
    },
}