from celery import Celery  # type: ignore[import-untyped]

from app.core.config import settings

broker_url = getattr(settings, "CELERY_BROKER_URL", "redis://localhost:6379/1")
result_backend = getattr(settings, "CELERY_RESULT_BACKEND", "redis://localhost:6379/2")

celery_app = Celery(
    "tenant_analytics_worker",
    broker=broker_url,
    backend=result_backend,
    include=[
        "app.workers.analytics_tasks",
        "app.workers.email_tasks",
    ],
)

celery_app.conf.update(
    task_always_eager=True,       # Executes tasks locally & synchronously without Redis
    task_eager_propagates=True,   # Raises exceptions directly in the calling thread
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)