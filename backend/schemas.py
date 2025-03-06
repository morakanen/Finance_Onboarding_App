from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

# ✅ User Schema
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: Optional[str] = "user"

class UserCreate(UserBase):
    password: str  # Hash this before saving in DB

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

# ✅ Client Schema
class ClientBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientResponse(ClientBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# ✅ Onboarding Schema
class OnboardingBase(BaseModel):
    client_id: UUID
    status: str  # pending, in_progress, completed

class OnboardingCreate(OnboardingBase):
    pass

class OnboardingResponse(OnboardingBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# ✅ Risk Assessment Schema
class RiskAssessmentBase(BaseModel):
    client_id: UUID
    risk_score: int
    classification: str  # high, standard

class RiskAssessmentCreate(RiskAssessmentBase):
    details: Optional[dict] = None

class RiskAssessmentResponse(RiskAssessmentBase):
    id: UUID

    class Config:
        from_attributes = True