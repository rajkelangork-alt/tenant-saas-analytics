import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("audit")


class AuditService:
    @staticmethod
    async def log_action(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        action: str,  # e.g., "USER_CREATED", "DASHBOARD_DELETED"
        resource_type: str,  # e.g., "user", "dashboard"
        resource_id: str,
        details: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tenant_id": str(tenant_id),
            "user_id": str(user_id),
            "action": action,
            "resource_type": resource_type,
            "resource_id": str(resource_id),
            "details": details or {},
        }
        # Structured log output for SIEM / external forwarders
        logger.info("AUDIT_EVENT: %s", record)
        return record