from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from schemas import UserResponse
from typing import List
from uuid import UUID
from models import RoleEnum
from utils.auth import hash_password

# Use a router with explicit prefix
router = APIRouter(prefix="/api")

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """Get all users"""
    try:
        users = db.query(models.User).all()
        return users
    except Exception as e:
        print(f"Error retrieving users: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving users: {str(e)}")

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: str, db: Session = Depends(get_db)):
    """Get a specific user by ID"""
    try:
        # Convert string to UUID, handle invalid UUIDs gracefully
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            print(f"Invalid UUID format: {user_id}")
            raise HTTPException(status_code=400, detail="Invalid user ID format")
            
        # Check if user exists
        user = db.query(models.User).filter_by(id=user_uuid).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        return user
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error retrieving user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving user: {str(e)}")

@router.post("/create-admin")
def create_admin_user(db: Session = Depends(get_db)):
    """Create an admin user"""
    try:
        # Check if admin user already exists
        admin = db.query(models.User).filter(models.User.role == RoleEnum.admin).first()
        if admin:
            return {"message": "Admin user already exists", "user_id": str(admin.id)}

        # Create admin user with default credentials
        hashed_password = hash_password("admin123")
        admin_user = models.User(
            email="admin@example.com",
            name="Admin User",
            hashed_password=hashed_password,
            role=RoleEnum.admin
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        return {"message": "Admin user created successfully", "user_id": str(admin_user.id)}
    except Exception as e:
        print(f"Error creating admin user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating admin user: {str(e)}")
