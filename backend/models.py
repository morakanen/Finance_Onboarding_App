from sqlalchemy import Column, String, UUID, TIMESTAMP, Integer, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy import Enum as SQLAlchemyEnum
import enum
import uuid
from database import engine,Base  # ✅ Correct way to import Base

class RoleEnum(str, enum.Enum):
    user = "user"
    admin = "admin"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(SQLAlchemyEnum(RoleEnum), default=RoleEnum.user)

class Client(Base):
    __tablename__ = "clients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    onboarding = relationship("OnboardingProcess", back_populates="client", lazy="joined")

class StatusEnum(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"

class OnboardingProcess(Base):
    __tablename__ = "onboarding_processes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    status = Column(SQLAlchemyEnum(StatusEnum), default=StatusEnum.pending)
    created_at = Column(TIMESTAMP, server_default=func.now())

    client = relationship("Client", back_populates="onboarding", lazy="joined")

class RiskEnum(str, enum.Enum):
    high = "high"
    standard = "standard"

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    risk_score = Column(Integer, nullable=False)
    classification = Column(SQLAlchemyEnum(RiskEnum), nullable=False)
    details = Column(JSON, nullable=True)
