from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from schemas import FormProgressIn, FormProgressOut, ApplicationOut
from typing import List
from uuid import UUID

# Use a router with explicit prefix
router = APIRouter(prefix="/api")

@router.get("/applications", response_model=List[ApplicationOut])
def get_all_applications(user_id: str = None, db: Session = Depends(get_db)):
    """Get all applications, with optional user filtering"""
    try:
        query = db.query(models.Application)
        
        # Filter by user_id if provided
        if user_id:
            try:
                # Convert to UUID if it's a valid format
                user_uuid = UUID(user_id)
                query = query.filter(models.Application.user_id == user_uuid)
            except ValueError:
                print(f"Invalid UUID format for user_id: {user_id}")
                # Return empty list for invalid UUIDs
                return []
        
        applications = query.all()
        print(f"Found {len(applications)} applications" + (f" for user {user_id}" if user_id else ""))
        return applications
    except Exception as e:
        print(f"Error retrieving applications: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving applications: {str(e)}")

from pydantic import BaseModel

class ApplicationCreate(BaseModel):
    user_id: str = None

@router.post("/applications", response_model=ApplicationOut)
def create_application(application_data: ApplicationCreate, db: Session = Depends(get_db)):
    """Create a new application"""
    try:
        # Get the first user if user_id is not provided
        user_id = application_data.user_id
        if not user_id:
            user = db.query(models.User).first()
            if not user:
                raise HTTPException(status_code=404, detail="No users found")
            user_id = user.id
            
        # Create new application
        new_application = models.Application(
            user_id=user_id,
            status="in_progress"
        )
        db.add(new_application)
        db.commit()
        db.refresh(new_application)
        return new_application
    except Exception as e:
        db.rollback()
        print(f"Error creating application: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating application: {str(e)}")

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
def get_form_progress(application_id: str, step: str, db: Session = Depends(get_db)):
    try:
        # Convert string to UUID, handle invalid UUIDs gracefully
        try:
            app_uuid = UUID(application_id)
        except ValueError:
            print(f"Invalid UUID format: {application_id}")
            # Instead of returning a 422 error, return a 404 which is more expected
            # This helps the frontend handle the case better
            raise HTTPException(status_code=404, detail="Form progress not found")
            
        progress = db.query(models.FormProgress).filter_by(
            application_id=app_uuid, 
            step=step
        ).first()
        if not progress:
            raise HTTPException(status_code=404, detail="Form progress not found")
        return progress
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print(f"Error retrieving form progress: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving form progress: {str(e)}")

@router.get("/form-progress/all/{application_id}", response_model=list[FormProgressOut])
def get_all_form_progress(application_id: str, db: Session = Depends(get_db)):
    """Get all form progress for a specific application"""
    try:
        # Convert string to UUID, handle invalid UUIDs gracefully
        try:
            app_uuid = UUID(application_id)
        except ValueError:
            print(f"Invalid UUID format: {application_id}")
            # Return empty list for invalid UUIDs instead of error
            return []
            
        # Check if application exists
        application = db.query(models.Application).filter_by(id=app_uuid).first()
        
        # If application doesn't exist, just return an empty list
        # We don't want to auto-create applications here as it can cause issues
        if not application:
            print(f"Application {application_id} not found")
            return []
        
        # Return all progress for this application
        progress = db.query(models.FormProgress).filter_by(application_id=app_uuid).all()
        
        # Log detailed information about the progress records
        if progress:
            print(f"Found {len(progress)} progress records for application {application_id}:")
            for p in progress:
                print(f"  - Step: {p.step}, Last updated: {p.last_updated}")
                if p.data:
                    print(f"    Data keys: {list(p.data.keys() if p.data else [])}")
        else:
            print(f"No progress records found for application {application_id}")
            
        return progress
    except Exception as e:
        print(f"Error retrieving form progress: {str(e)}")
        # Return empty list instead of error
        return []

@router.get("/debug/form-progress")
def debug_form_progress(db: Session = Depends(get_db)):
    """Debug endpoint to check all form progress data"""
    try:
        # Get all form progress records
        all_progress = db.query(models.FormProgress).all()
        
        # Group by application
        result = {}
        for p in all_progress:
            app_id = str(p.application_id)
            if app_id not in result:
                result[app_id] = []
                
            result[app_id].append({
                "id": str(p.id),
                "step": p.step,
                "last_updated": p.last_updated,
                "data_keys": list(p.data.keys() if p.data else []),
                "has_data": p.data is not None and bool(p.data)
            })
        
        return {
            "total_records": len(all_progress),
            "applications": result
        }
    except Exception as e:
        print(f"Error in debug endpoint: {str(e)}")
        return {
            "error": str(e),
            "total_records": 0,
            "applications": {}
        }
