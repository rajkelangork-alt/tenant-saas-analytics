import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.dependencies import (
    RoleChecker,
    get_current_active_user,
)
from app.db.models import User, UserRole
from app.db.session import get_db
from app.models.users import UserCreate, UserResponse, UserUpdate
from app.services.user_service import UserService
from app.workers.email_tasks import send_welcome_email

router = APIRouter(prefix="/users", tags=["Users"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
ActiveUser = Annotated[User, Depends(get_current_active_user)]
RequireAdmin = Annotated[
    User,
    Depends(
        RoleChecker(
            [
                UserRole.SUPER_ADMIN,
                UserRole.TENANT_ADMIN,
            ]
        )
    ),
]


@router.get("", response_model=list[UserResponse])
async def list_users(
    current_user: ActiveUser,
    db: DbSession,
) -> Any:
    return await UserService.get_users_by_tenant(db, current_user.tenant_id)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    current_user: RequireAdmin,
    db: DbSession,
) -> Any:
    new_user = await UserService.create_user(db, current_user.tenant_id, user_in)

    # Dispatch asynchronous background welcome email task
    send_welcome_email.delay(new_user.email, str(current_user.tenant_id))

    return new_user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    current_user: ActiveUser,
    db: DbSession,
) -> Any:
    return await UserService.get_user_by_id(db, current_user.tenant_id, user_id)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    user_in: UserUpdate,
    current_user: RequireAdmin,
    db: DbSession,
) -> Any:
    return await UserService.update_user(
        db, current_user.tenant_id, user_id, user_in
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    current_user: RequireAdmin,
    db: DbSession,
) -> None:
    await UserService.delete_user(db, current_user.tenant_id, user_id)