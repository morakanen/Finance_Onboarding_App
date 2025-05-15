from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from schemas import FormProgressIn, FormProgressOut
from uuid import UUID

router = APIRouter()

@router.post("/form-progress", response_model=FormProgressOut)
def save_form_progress(form: FormProgressIn, db: Session = Depends(get_db)):
    try:
        # First, check if the application exists
        application = db.query(models.Application).filter_by(id=form.application_id).first()
        
        # If application doesn't exist, create it (using the first user as owner for now)
        if not application:
            user = db.query(models.User).first()
            if not user:
                raise HTTPException(status_code=404, detail="No users found to associate with application")
                
            application = models.Application(id=form.application_id, user_id=user.id)
            db.add(application)
            db.commit()
            db.refresh(application)
        
        # Upsert: update if exists, else create new
        existing = db.query(models.FormProgress).filter_by(
            application_id=form.application_id, 
            step=form.step
        ).first()
        
        if existing:
            existing.data = form.data
            db.commit()
            db.refresh(existing)
            return existing
            
        progress = models.FormProgress(
            application_id=form.application_id,
            step=form.step,
            data=form.data
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
        return progress
    except Exception as e:
        db.rollback()
        print(f"Error saving form progress: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving form progress: {str(e)}")

@router.get("/form-progress/{application_id}/{step}", response_model=FormProgressOut)
def get_form_progress(application_id: UUID, step: str, db: Session = Depends(get_db)):
    progress = db.query(models.FormProgress).filter_by(
        application_id=application_id, 
        step=step
    ).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Form progress not found")
    return progress

@router.get("/form-progress/all/{application_id}", response_model=list[FormProgressOut])
def get_all_form_progress(application_id: UUID, db: Session = Depends(get_db)):
    """Get all form progress for a specific application"""
    return db.query(models.FormProgress).filter_by(application_id=application_id).all()
