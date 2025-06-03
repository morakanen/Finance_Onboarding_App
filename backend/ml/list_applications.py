import sys
import os
from pathlib import Path
from sqlalchemy.orm import Session
import logging
from fastapi import FastAPI

# Add parent directory to path to import from backend
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

# Import FastAPI app and database
from main import app
from database import get_db
from models import Application, FormProgress

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def list_applications():
    """
    List all applications in the database with their basic info
    """
    try:
        # Get database session
        db = next(get_db())
        
        # Get all applications
        applications = db.query(Application).all()
        
        print("\nAvailable Applications:")
        print("-" * 80)
        
        for app in applications:
            # Get form progress data
            client_details = None
            for progress in app.form_progress:
                if progress.step == "clientDetails" and progress.data:
                    client_details = progress.data
                    break
            
            # Print application info
            print(f"Application ID: {app.id}")
            print(f"Created: {app.created_at}")
            print(f"Status: {app.status}")
            
            if client_details:
                print(f"Client: {client_details.get('firstName', '')} {client_details.get('lastName', '')}")
                print(f"Business Type: {client_details.get('businessType', 'N/A')}")
                print(f"Country: {client_details.get('country', 'N/A')}")
            
            print("-" * 80)
        
    except Exception as e:
        logger.error(f"Error listing applications: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    list_applications()
