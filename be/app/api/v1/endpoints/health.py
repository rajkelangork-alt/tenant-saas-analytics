# app/api/v1/endpoints/health.py
from fastapi import APIRouter

router = APIRouter()


@router.get("/health", summary="Health Check")
async def health_check():
    return {
        "status": "online",
        "service": "Multi-Tenant SaaS Analytics API",
        "version": "1.0.0"
    }