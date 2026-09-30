import uuid

from pydantic import BaseModel, ConfigDict, EmailStr

from app.db.models import AuthProvider, UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    password: str
    tenant_name: str
    role: UserRole = UserRole.TENANT_ADMIN


class UserResponse(UserBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    role: UserRole
    auth_provider: AuthProvider
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    tenant_slug: str | None = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str