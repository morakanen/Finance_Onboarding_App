from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from schemas import ApplicationIn, ApplicationOut
from uuid import UUID

router = APIRouter()

@router.post("/applications", response_model=ApplicationOut)
def create_application(application: ApplicationIn, db: Session = Depends(get_db)):
    """Create a new application (onboarding session) for a user"""
    new_application = models.Application(
        user_id=application.user_id,
        status="in_progress"
    )
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    return new_application

@router.get("/applications/user/{user_id}", response_model=list[ApplicationOut])
def get_user_applications(user_id: UUID, db: Session = Depends(get_db)):
    """Get all applications for a specific user"""
    return db.query(models.Application).filter_by(user_id=user_id).all()

@router.get("/applications/{application_id}", response_model=ApplicationOut)
def get_application(application_id: UUID, db: Session = Depends(get_db)):
    """Get a specific application by ID"""
    application = db.query(models.Application).filter_by(id=application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application
