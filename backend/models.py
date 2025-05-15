from sqlalchemy import Column, String, UUID, TIMESTAMP, Integer, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy import Enum as SQLAlchemyEnum
import enum
import uuid
from database import engine, Base  # ✅ Correct import of Base


# User roles
class RoleEnum(str, enum.Enum):
    user = "user"
    admin = "admin"


# User model
class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(SQLAlchemyEnum(RoleEnum), default=RoleEnum.user)
    
    # Relationships
    applications = relationship("Application", back_populates="user", lazy="joined")


# Client model
class Client(Base):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    onboarding = relationship("OnboardingProcess", back_populates="client", lazy="joined")
    form_progress = relationship("FormProgress", back_populates="client", lazy="joined")


# Onboarding status
class StatusEnum(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


# Onboarding process tracking
class OnboardingProcess(Base):
    __tablename__ = "onboarding_processes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    status = Column(SQLAlchemyEnum(StatusEnum), default=StatusEnum.pending)
    created_at = Column(TIMESTAMP, server_default=func.now())
    current_step = Column(String, nullable=True)  # ✅ Track current form step

    # Relationship with Client
    client = relationship("Client", back_populates="onboarding", lazy="joined")


# Risk classification
class RiskEnum(str, enum.Enum):
    high = "high"
    standard = "standard"


# Risk assessment model
class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    risk_score = Column(Integer, nullable=False)
    classification = Column(SQLAlchemyEnum(RiskEnum), nullable=False)
    details = Column(JSON, nullable=True)


# Application model
class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(TIMESTAMP, server_default=func.now())
    status = Column(String, server_default="in_progress")
    
    # Relationships
    form_progress = relationship("FormProgress", back_populates="application", lazy="joined")
    user = relationship("User", lazy="joined")


# ✅ Form Progress Model (Allows Saving Progress for Onboarding Forms)
class FormProgress(Base):
    __tablename__ = "form_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=True)
    step = Column(String, nullable=False)  # ✅ Step the user is on
    data = Column(JSON, nullable=True)  # ✅ Store form data
    last_updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationship with Client
    client = relationship("Client", back_populates="form_progress", lazy="joined")
    # Relationship with Application
    application = relationship("Application", back_populates="form_progress", lazy="joined")


