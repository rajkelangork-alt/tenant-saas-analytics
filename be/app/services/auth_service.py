import re

import jwt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.db.models import Tenant, User
from app.models.auth import (
    LoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
)


def generate_slug(name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]+", "-", name.strip().lower()).strip("-")


class AuthService:
    @staticmethod
    async def register_tenant_admin(
        db: AsyncSession, user_in: UserCreate
    ) -> TokenResponse:
        slug_base = generate_slug(user_in.tenant_name)
        existing_tenant = await db.scalar(
            select(Tenant).where(Tenant.slug == slug_base)
        )
        if existing_tenant:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A tenant with this name already exists.",
            )

        new_tenant = Tenant(
            name=user_in.tenant_name,
            slug=slug_base,
            is_active=True,
        )
        db.add(new_tenant)
        await db.flush()

        hashed_password = get_password_hash(user_in.password)
        new_user = User(
            tenant_id=new_tenant.id,
            email=user_in.email,
            hashed_password=hashed_password,
            full_name=user_in.full_name,
            role=user_in.role,
            is_active=True,
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        access_token = create_access_token(
            new_user.id, new_user.tenant_id, {"role": new_user.role.value}
        )
        refresh_token = create_refresh_token(new_user.id, new_user.tenant_id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(new_user),
        )

    @staticmethod
    async def authenticate(
        db: AsyncSession, login_in: LoginRequest
    ) -> TokenResponse:
        query = select(User).where(User.email == login_in.email)
        result = await db.execute(query)
        users = result.scalars().all()

        if not users:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        target_user = None
        for user in users:
            if user.hashed_password and verify_password(
                login_in.password, user.hashed_password
            ):
                target_user = user
                break

        if not target_user or not target_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials or inactive account.",
            )

        access_token = create_access_token(
            target_user.id,
            target_user.tenant_id,
            {"role": target_user.role.value},
        )
        refresh_token = create_refresh_token(
            target_user.id, target_user.tenant_id
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(target_user),
        )

    @staticmethod
    async def refresh_tokens(
        db: AsyncSession, refresh_in: RefreshTokenRequest
    ) -> TokenResponse:
        try:
            payload = decode_token(refresh_in.refresh_token, is_refresh=True)
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
            )
        
        user_id = payload.get("sub")
        user = await db.get(User, user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive.",
            )

        access_token = create_access_token(
            user.id, user.tenant_id, {"role": user.role.value}
        )
        new_refresh = create_refresh_token(user.id, user.tenant_id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh,
            user=UserResponse.model_validate(user),
        )