from sqlalchemy import Column, String, UUID, TIMESTAMP, Integer, ForeignKey, Enum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user")


    
class Client(Base):
    __tablename__ = "clients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    onboarding = relationship("OnboardingProcess", back_populates="client")

class OnboardingProcess(Base):
    __tablename__ = "onboarding_processes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    status = Column(Enum("pending", "in_progress", "completed", name="status_enum"), default="pending")
    created_at = Column(TIMESTAMP, server_default=func.now())
    client = relationship("Client", back_populates="onboarding")

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    risk_score = Column(Integer, nullable=False)
    classification = Column(Enum("high", "standard", name="risk_enum"), nullable=False)
    details = Column(JSON, nullable=True)

