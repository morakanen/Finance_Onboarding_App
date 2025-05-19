from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Union
import uuid

# Try to import risk scoring functions, but make it fault-tolerant
import logging

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
    logger.addHandler(handler)

try:
    # Use absolute import since we're in a package
    from ml.risk_scorer import risk_scorer
    ML_AVAILABLE = True
    logger.info("Successfully imported risk_scorer")
except (ImportError, ModuleNotFoundError) as e:
    ML_AVAILABLE = False
    logger.error(f"Failed to import risk_scorer: {str(e)}")
    # Define fallback functions if ML module isn't available
    class DummyScorer:
        def score_applicant(self, applicant_data):
            return {
                "risk_label": "medium",
                "risk_score": 50,
                "scoring_method": "fallback", 
                "risk_factors": []
            }
            
        def get_risk_categories(self) -> Dict[str, Dict[str, Any]]:
            return {
                'high': {
                    'threshold': 70,
                    'description': 'High risk clients require enhanced due diligence',
                    'color': '#EF4444'  # Red color for high risk
                },
                'medium': {
                    'threshold': 40,
                    'description': 'Medium risk clients require standard due diligence',
                    'color': '#F59E0B'  # Amber color for medium risk
                },
                'low': {
                    'threshold': 0,
                    'description': 'Low risk clients require simplified due diligence',
                    'color': '#10B981'  # Green color for low risk
                }
            }
    
    risk_scorer = DummyScorer()

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
        logger.info("Getting risk categories...")
        categories = risk_scorer.get_risk_categories()
        logger.info(f"Risk categories: {categories}")
        return {"categories": categories}
    except Exception as e:
        logger.error(f"Error retrieving risk categories: {str(e)}")
        logger.error("Stack trace:", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/applications/risk-score", tags=["Risk Assessment"])
async def get_application_risk_score(applicant_data: ApplicantData):
    """Calculate the risk score for a given application.
    The input should be a JSON object containing all necessary fields from the onboarding forms.
    """
    try:
        # Convert Pydantic model to dict for scoring
        data_dict = applicant_data.dict()
        
        logger.info("Calculating risk score...")
        logger.info(f"ML_AVAILABLE: {ML_AVAILABLE}")
        
        # Get risk assessment
        result = risk_scorer.score_applicant(data_dict)
        logger.info(f"Risk assessment result: {result}")
        
        return result
    except Exception as e:
        # Catch-all for other unexpected errors
        logger.error(f"Unexpected error in risk scoring: {str(e)}")
        logger.error("Stack trace:", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
