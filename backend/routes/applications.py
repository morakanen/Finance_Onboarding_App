from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from database import get_db
import models
from schemas import ApplicationIn, ApplicationOut
from uuid import UUID
from datetime import datetime
from typing import Dict, Any
from utils.email import send_application_completed_email

router = APIRouter(prefix="/api")

@router.post("/form-progress")
async def save_form_progress(
    application_id: UUID = Body(...),
    step: str = Body(...),
    data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """Save form progress for a specific application step"""
    # Check if application exists
    application = db.query(models.Application).filter_by(id=application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Update or create form progress
    form_progress = db.query(models.FormProgress).filter_by(
        application_id=application_id,
        step=step
    ).first()
    
    if form_progress:
        form_progress.data = data
        form_progress.last_updated = datetime.utcnow()
    else:
        form_progress = models.FormProgress(
            application_id=application_id,
            step=step,
            data=data,
            last_updated=datetime.utcnow()
        )
        db.add(form_progress)
    
    db.commit()
    
    # Check if this was the last form completed
    all_forms = db.query(models.FormProgress).filter_by(application_id=application_id).all()
    required_forms = [
        'personal_info',
        'contact_info',
        'employment',
        'income',
        'expenses',
        'assets',
        'liabilities',
        'documents',
        'review'
    ]
    
    completed_forms = {form.step for form in all_forms}
    if all(form in completed_forms for form in required_forms):
        application = db.query(models.Application).filter_by(id=application_id).first()
        if application and application.status != 'completed':
            application.status = 'completed'
            db.commit()
            
            # Send email notification
            success = await send_application_completed_email(str(application_id), str(application.user_id))
            if not success:
                print(f"Failed to send email notification for application {application_id}")
    
    return {"message": "Form progress saved successfully"}

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

@router.get("/applications/{application_id}/forms", response_model=list)
def get_application_forms(application_id: UUID, db: Session = Depends(get_db)):
    """Get all form details for a specific application"""
    # First check if application exists
    application = db.query(models.Application).filter_by(id=application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Get all form progress entries for this application
    forms = db.query(models.FormProgress).filter_by(application_id=application_id).all()
    
    # Convert to response format
    return [{
        "id": str(form.id),
        "step": form.step,
        "data": form.data,
        "last_updated": form.last_updated
    } for form in forms]

@router.patch("/applications/{application_id}/status")
async def update_application_status(application_id: UUID, status: str, db: Session = Depends(get_db)):
    """Update the status of an application"""
    application = db.query(models.Application).filter_by(id=application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    application.status = status
    db.commit()
    db.refresh(application)
    
    # Send email notification when application is completed
    if status == 'completed':
        success = await send_application_completed_email(str(application_id), str(application.user_id))
        if not success:
            print(f"Failed to send email notification for application {application_id}")
    
    return {"status": "success", "message": f"Application status updated to {status}"}
