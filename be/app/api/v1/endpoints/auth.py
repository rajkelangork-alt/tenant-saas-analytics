from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.dependencies import get_current_active_user
from app.db.models import User
from app.db.session import get_db
from app.models.auth import (
    LoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
ActiveUser = Annotated[User, Depends(get_current_active_user)]


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    db: DbSession,
) -> TokenResponse:
    try:
        return await AuthService.authenticate(db, payload)
    except HTTPException:
        raise
    except (AttributeError, ValueError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials or tenant slug.",
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_in: RefreshTokenRequest,
    db: DbSession,
) -> TokenResponse:
    try:
        return await AuthService.refresh_tokens(db, token_in)
    except HTTPException:
        raise
    except (AttributeError, ValueError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )


@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: ActiveUser,
) -> UserResponse:
    return UserResponse.model_validate(current_user)