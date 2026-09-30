import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.db.models import User
from app.models.users import UserCreate, UserUpdate


class UserService:
    @staticmethod
    async def get_users_by_tenant(
        db: AsyncSession,
        tenant_id: uuid.UUID,
    ) -> list[User]:
        query = select(User).where(User.tenant_id == tenant_id)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_user_by_id(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> User:
        query = select(User).where(User.id == user_id, User.tenant_id == tenant_id)
        user = await db.scalar(query)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in current tenant.",
            )
        return user

    @staticmethod
    async def create_user(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_in: UserCreate,
    ) -> User:
        # Check if email is already in use
        existing_query = select(User).where(User.email == user_in.email)
        existing_user = await db.scalar(existing_query)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered.",
            )

        hashed_password = get_password_hash(user_in.password)
        new_user = User(
            email=user_in.email,
            hashed_password=hashed_password,
            full_name=user_in.full_name,
            role=user_in.role,
            is_active=user_in.is_active,
            tenant_id=tenant_id,
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user

    @staticmethod
    async def update_user(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        user_in: UserUpdate,
    ) -> User:
        user = await UserService.get_user_by_id(db, tenant_id, user_id)
        update_data = user_in.model_dump(exclude_unset=True)

        password = update_data.pop("password", None)
        if password:
            update_data["hashed_password"] = get_password_hash(password)

        for field, value in update_data.items():
            setattr(user, field, value)

        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def delete_user(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        user = await UserService.get_user_by_id(db, tenant_id, user_id)
        await db.delete(user)
        await db.commit()