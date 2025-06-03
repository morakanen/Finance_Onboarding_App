from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Union
from sqlalchemy.orm import Session
from database import get_db
from models import Application, FormProgress
from schemas import RiskAssessmentResponse
import uuid
import os
import logging

# Import our new modular risk assessment service
from ml.risk_assessment_service import risk_assessment_service

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
    logger.addHandler(handler)

router = APIRouter()

# Define the expected input model. It should match the keys used in predict_risk.
# All fields used in predict_risk (EXPECTED_CATEGORICAL_COLS and COMMENT_FIELDS) must be here.
class ApplicantData(BaseModel):
    # Client Details
    title: str
    firstName: str
    lastName: str
    gender: str
    country: str
    taxType: str
    taxInvestigationCover: str
    isVatInvoiceRequired: str
    isStatementRequired: str
    
    # Business Details
    businessType: str
    contactType: str
    
    # Fees and Associations
    recurring_fees: float
    non_recurring_fees: float
    number_of_associations: int
    
    # Risk Assessment Binary Fields
    met_face_to_face: str
    visited_business_address: str
    is_uk_resident: str
    is_uk_national: str
    known_to_partner: str
    reputable_referral: str
    plausible_wealth_level: str
    
    # KYC Binary Fields
    identity_verified: str
    evidence_recorded: str
    client_honest_assessment: str
    wealth_plausible: str
    adverse_records: str
    beneficial_owners_verified: str
    other_identity_concerns: str
    
    # Optional fields
    middleName: str = ""
    salutation: str = ""
    addressLine1: str = ""
    addressLine2: str = ""
    town: str = ""
    county: str = ""
    postcode: str = ""
    dob: str = ""
    vatNumber: str = ""
    niNumber: str = ""
    utr: str = ""
    yearEnd: str = ""
    isBillingSameAddress: str = ""
    billingAddressLine1: str = ""
    billingAddressLine2: str = ""
    billingTown: str = ""
    billingCounty: str = ""
    billingPostcode: str = ""
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
        categories = risk_assessment_service.get_risk_categories()
        logger.info(f"Risk categories: {categories}")
        return {"categories": categories}
    except Exception as e:
        logger.error(f"Error retrieving risk categories: {str(e)}")
        logger.error("Stack trace:", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/applications/{application_id}/risk-score", tags=["Risk Assessment"])
async def get_application_risk_score_by_id(
    application_id: str,
    rule_weight: float = Query(0.5, ge=0.0, le=1.0, description="Weight for rule-based score (0.0-1.0). ML weight will be (1-rule_weight)"),
    db: Session = Depends(get_db)
):
    """Get the risk score for a specific application.
    
    Parameters:
    - application_id: ID of the application to get risk score for
    - rule_weight: Weight for rule-based score (0.0-1.0), default is 0.5 (equal weighting)
    """
    try:
        # Get application data
        application = db.query(Application).filter(Application.id == application_id).first()
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Get form progress data
        form_progresses = db.query(FormProgress).filter(FormProgress.application_id == application_id).all()
        if not form_progresses:
            raise HTTPException(status_code=404, detail="Form progress not found")
            
        # Combine all form data
        combined_data = {}
        for form in form_progresses:
            if form.data:
                combined_data.update(form.data)
        
        # Check for required fields and set defaults if missing
        required_fields = {
            "country": "United Kingdom",
            "businessType": "Limited Company",
            "contactType": "Email",
            "gender": "Not Specified",
            "taxInvestigationCover": "no",
            "isVatInvoiceRequired": "no",
            "isStatementRequired": "no"
        }
        
        for field, default_value in required_fields.items():
            if field not in combined_data or not combined_data[field]:
                combined_data[field] = default_value
                logger.info(f"Using default value for {field}: {default_value}")
        
        # Get risk assessment with configurable weights
        result = risk_assessment_service.assess_risk(combined_data, rule_weight)
        
        # Include the weights used in the response
        result['weights'] = {
            'rule_based': rule_weight,
            'ml_based': 1.0 - rule_weight
        }
        
        return result
    except Exception as e:
        logger.error(f"Error getting risk assessment for application {application_id}: {str(e)}")
        logger.error("Stack trace:", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/risk-assessment/{application_id}", response_model=RiskAssessmentResponse)
def get_risk_assessment(
    application_id: str,
    db: Session = Depends(get_db)
) -> RiskAssessmentResponse:
    try:
        # Get application data
        application = db.query(Application).filter(Application.id == application_id).first()
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Get form progress data
        form_progress = db.query(FormProgress).filter(FormProgress.application_id == application_id).first()
        if not form_progress:
            raise HTTPException(status_code=404, detail="Form progress not found")
        
        # Convert form data to ApplicantData model
        applicant_data = ApplicantData(**form_progress.data)
        
        # Get risk assessment with both scores
        result = risk_assessment_service.assess_risk(applicant_data.dict())
        
        # Extract the rule-based and ML assessments
        rule_based = result['rule_based']
        ml_based = result['ml_based']
        
        # Create response
        return RiskAssessmentResponse(
            client_id=application.user_id,  # Using user_id since that's what we have
            rule_based_score=rule_based['score'],
            rule_based_level=rule_based['level'],
            rule_based_factors=rule_based['factors'],
            ml_score=ml_based['score'],
            ml_level=ml_based['level'],
            ml_factors=ml_based['factors'],
            comments=result['comments']
        )
    except Exception as e:
        logger.error(f"Unexpected error in risk scoring: {str(e)}")
        logger.error("Stack trace:", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/applications/risk-score", tags=["Risk Assessment"])
async def get_application_risk_score(
    applicant_data: ApplicantData,
    rule_weight: float = Query(0.5, ge=0.0, le=1.0, description="Weight for rule-based score (0.0-1.0). ML weight will be (1-rule_weight)"),
):
    """Calculate the risk score for a given application.
    The input should be a JSON object containing all necessary fields from the onboarding forms.
    
    Parameters:
    - applicant_data: All required applicant information
    - rule_weight: Weight for rule-based score (0.0-1.0), default is 0.5 (equal weighting)
    """
    try:
        # Convert Pydantic model to dict for scoring
        data_dict = applicant_data.dict()
        
        logger.info(f"Calculating risk score using modular risk assessment service with rule_weight={rule_weight}...")
        
        # Get risk assessment from our modular service with the specified weight
        result = risk_assessment_service.assess_risk(data_dict, rule_weight)
        logger.info(f"Risk assessment result: {result}")
        
        # Include the weights used in the response
        result['weights'] = {
            'rule_based': rule_weight,
            'ml_based': 1.0 - rule_weight
        }
        
        return result
    except Exception as e:
        # Catch-all for other unexpected errors
        logger.error(f"Unexpected error in risk scoring: {str(e)}")
        logger.error("Stack trace:", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
