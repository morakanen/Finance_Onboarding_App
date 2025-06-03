import sys
import os
from pathlib import Path
from sqlalchemy.orm import Session
from typing import Dict, Any, List
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
from routes.risk_assessment import risk_scorer, ApplicantData

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_application_data(db: Session, application_id: str) -> Dict[str, Any]:
    """
    Retrieve all form data for a given application
    """
    # Get application and all its form progress entries
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise ValueError(f"Application {application_id} not found")
    
    # Combine all form data
    combined_data = {}
    for progress in application.form_progress:
        if progress.data:  # Ensure data exists
            combined_data.update(progress.data)
    
    return combined_data

def test_live_application(application_id: str):
    """
    Test risk assessment on a live application from the database
    """
    try:
        # Get database session
        db = next(get_db())
        
        # Get application data
        logger.info(f"Retrieving application {application_id}...")
        application_data = get_application_data(db, application_id)
        
        # Convert to ApplicantData model
        applicant = ApplicantData(**application_data)
        
        # Run risk assessment
        logger.info("Running risk assessment...")
        result = risk_scorer.score_applicant(applicant)
        
        # Print results
        print("\nRisk Assessment Results:")
        print("-" * 80)
        print(f"Application ID: {application_id}")
        print(f"Business Type: {getattr(applicant, 'businessType', 'N/A')}")
        print(f"Country: {getattr(applicant, 'country', 'N/A')}")
        print(f"Tax Type: {getattr(applicant, 'taxType', 'N/A')}")
        
        # Financial details
        recurring = float(getattr(applicant, 'recurring_fees', 0))
        non_recurring = float(getattr(applicant, 'non_recurring_fees', 0))
        total_fees = recurring + non_recurring
        print(f"Total Fees: £{total_fees:,.2f}")
        
        # Risk factors
        risk_factors = []
        if getattr(applicant, 'adverse_records', 'no').lower() == 'yes':
            risk_factors.append("Has adverse records")
        if getattr(applicant, 'other_identity_concerns', 'no').lower() == 'yes':
            risk_factors.append("Identity concerns")
        if not getattr(applicant, 'met_face_to_face', 'yes').lower() == 'yes':
            risk_factors.append("No face-to-face meeting")
        if not getattr(applicant, 'is_uk_resident', 'yes').lower() == 'yes':
            risk_factors.append("Non-UK resident")
            
        print(f"Key Risk Factors: {', '.join(risk_factors) if risk_factors else 'None'}")
        
        # Risk score and comment analysis
        print(f"Base Risk Score: {result.get('base_risk_score', result.get('risk_score')):.1f}")
        if 'comment_risk_score' in result and result['comment_risk_score'] is not None:
            print(f"Comment Risk Score: {result['comment_risk_score']:.1f}")
            
            # Show detected risk keywords
            if 'comment_analysis' in result:
                print("\nDetected Risk Keywords:")
                if result['comment_analysis']['high_risk']:
                    print("High Risk:", ", ".join(result['comment_analysis']['high_risk']))
                if result['comment_analysis']['medium_risk']:
                    print("Medium Risk:", ", ".join(result['comment_analysis']['medium_risk']))
                if result['comment_analysis']['low_risk']:
                    print("Low Risk:", ", ".join(result['comment_analysis']['low_risk']))
        
        print(f"Final Risk Score: {result['risk_score']:.1f}")
        risk_label = "High" if result['risk_score'] >= 70 else "Medium" if result['risk_score'] >= 40 else "Low"
        print(f"Risk Label: {risk_label}")
        print("-" * 80)
        
    except Exception as e:
        logger.error(f"Error testing application: {str(e)}")
        raise
    finally:
        db.close()

def main():
    if len(sys.argv) != 2:
        print("Usage: python test_live_application.py <application_id>")
        sys.exit(1)
    
    application_id = sys.argv[1]
    test_live_application(application_id)

if __name__ == "__main__":
    main()
