import logging

from app.workers.celery_app import celery_app

logger = logging.getLogger("celery.tasks")


@celery_app.task(name="tasks.send_welcome_email")
def send_welcome_email(user_email: str, tenant_name: str) -> dict[str, str]:
    logger.info("Sending welcome email to %s for tenant %s", user_email, tenant_name)
    return {"recipient": user_email, "status": "sent"}