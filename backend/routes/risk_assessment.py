from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Union
import uuid

# Try to import risk scoring functions, but make it fault-tolerant
try:
    # Use relative import for Docker container compatibility
    from ..ml.risk_scorer import score_applicant, get_risk_categories
    ML_AVAILABLE = True
except (ImportError, ModuleNotFoundError):
    ML_AVAILABLE = False
    # Define fallback functions if ML module isn't available
    def score_applicant(applicant_data):
        return {
            "risk_label": "Medium",
            "risk_score": 50,
            "scoring_method": "fallback", 
            "risk_factors": []
        }
    
    def get_risk_categories():
        return {
            "High": {"threshold": 70, "color": "#EF4444"},
            "Medium": {"threshold": 40, "color": "#F59E0B"},
            "Low": {"threshold": 0, "color": "#10B981"}
        }

router = APIRouter()

# Define the expected input model. It should match the keys used in predict_risk.
# All fields used in predict_risk (EXPECTED_CATEGORICAL_COLS and COMMENT_FIELDS) must be here.
class ApplicantData(BaseModel):
    country: str
    sector: str
    businessType: str
    contactType: str
    introductoryCategory: str
    gender: str
    # Risk question comments
    risk_q1_comment: str = ""
    risk_q2_comment: str = ""
    risk_q3_comment: str = ""
    risk_q4_comment: str = ""
    risk_q5_comment: str = ""
    risk_q6_comment: str = ""
    risk_q7_comment: str = ""
    # Add any other fields your `predict_risk` function might expect
    # from the original synthetic data generation, even if not directly used
    # by the model, to ensure the input dictionary is complete.
    title: str = ""
    firstName: str = ""
    middleName: str = ""
    lastName: str = ""
    salutation: str = ""
    addressLine1: str = ""
    addressLine2: str = ""
    town: str = ""
    county: str = ""
    postcode: str = ""
    dob: str = ""
    dod: str = ""
    vatNumber: str = ""
    niNumber: str = ""
    utr: str = ""
    taxType: str = ""
    taxInvestigationCover: str = ""
    yearEnd: str = ""
    isVatInvoiceRequired: str = ""
    isStatementRequired: str = ""
    isBillingSameAddress: str = ""
    billingAddressLine1: str = ""
    billingAddressLine2: str = ""
    billingTown: str = ""
    billingCounty: str = ""
    billingCountry: str = ""
    billingPostcode: str = ""
    emailCorrespondence: str = ""
    emailFeeNote: str = ""
    emailVatInvoice: str = ""
    emailStatement: str = ""
    backupEmail: str = ""
    telephone1: str = ""
    telephone2: str = ""
    mobile: str = ""
    companyName: str = ""
    registrationNumber: str = ""
    professionalReferral: str = ""
    referredBy: str = ""
    # Risk question responses (yes/no) - not used by model but part of form data
    risk_q1_response: str = ""
    risk_q2_response: str = ""
    risk_q3_response: str = ""
    risk_q4_response: str = ""
    risk_q5_response: str = ""
    risk_q6_response: str = ""
    risk_q7_response: str = ""

    class Config:
        extra = 'ignore' # Allow extra fields in the input, but they won't be used by Pydantic model

@router.get("/api/risk-categories", tags=["Risk Assessment"])
async def get_risk_categories_info():
    """
    Get information about risk categories and their thresholds.
    This is useful for frontend display of risk information.
    """
    try:
        categories = get_risk_categories()
        return {"categories": categories}
    except Exception as e:
        print(f"Error retrieving risk categories: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving risk categories")


@router.post("/api/applications/risk-score", tags=["Risk Assessment"])
async def get_application_risk_score(applicant_data: ApplicantData):
    """
    Calculate the risk score for a given application.
    The input should be a JSON object containing all necessary fields from the onboarding forms.
    """
    try:
        # Convert Pydantic model to dictionary for the risk scoring function
        applicant_dict = applicant_data.dict()
        # Score the application using our modular risk scoring system
        risk_result = score_applicant(applicant_dict)
        
        # Add a temporary application ID if not provided
        # In a real scenario, this would come from the database
        application_id = "temp_" + str(uuid.uuid4())
        
        # Return comprehensive risk information
        return {
            "application_id": application_id,
            "risk_label": risk_result["risk_label"],
            "risk_score": risk_result["risk_score"],
            "scoring_method": risk_result["scoring_method"],
            "risk_factors": risk_result["risk_factors"]
        }
    except FileNotFoundError as e:
        # Specific error for model/vectorizer not found
        raise HTTPException(status_code=503, detail=f"ML model components not found. Error: {e}")
    except RuntimeError as e:
        # Specific error for model not loaded runtime error
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        # Errors during data processing
        raise HTTPException(status_code=400, detail=f"Error processing applicant data: {e}")
    except Exception as e:
        # Catch-all for other unexpected errors
        print(f"Unexpected error in risk scoring: {e}") # Log the full error server-side
        raise HTTPException(status_code=500, detail="An unexpected error occurred while calculating risk score.")
