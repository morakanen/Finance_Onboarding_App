"""
Test the XGBoost risk model on real applications from the database.
"""
import sys
import os
import json
from pathlib import Path
from types import SimpleNamespace
import pandas as pd
import numpy as np
import xgboost as xgb
import joblib

# Add the backend directory to the Python path
backend_dir = str(Path(__file__).parent.parent)
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

# Risk thresholds
HIGH_RISK_THRESHOLD = 80
MEDIUM_RISK_THRESHOLD = 50

# Model paths
XGBOOST_MODEL_PATH = Path(backend_dir) / 'ml' / 'xgboost_risk_model.json'
SCALER_PATH = Path(backend_dir) / 'ml' / 'feature_scaler.pkl'
FEATURE_NAMES_PATH = Path(backend_dir) / 'ml' / 'feature_names.json'

class ApplicantData:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

class RiskScorer:
    def __init__(self):
        self.model = xgb.XGBRegressor()
        self.model.load_model(str(XGBOOST_MODEL_PATH))
        self.preprocessor = joblib.load(str(SCALER_PATH))
        with open(FEATURE_NAMES_PATH, 'r') as f:
            self.feature_names = json.load(f)
    
    def score_applicant(self, applicant_data):
        # Create initial feature dictionary
        data = {}
        
        # Add numeric fields
        data['recurring_fees'] = float(getattr(applicant_data, 'recurring_fees', 0))
        data['non_recurring_fees'] = float(getattr(applicant_data, 'non_recurring_fees', 0))
        data['number_of_associations'] = int(getattr(applicant_data, 'number_of_associations', 0))
        
        # Add binary fields (convert yes/no to 1/0)
        bool_fields = [
            'met_face_to_face', 'visited_business_address', 'is_uk_resident',
            'is_uk_national', 'known_to_partner', 'reputable_referral',
            'plausible_wealth_level', 'identity_verified', 'evidence_recorded',
            'client_honest_assessment', 'wealth_plausible', 'adverse_records',
            'beneficial_owners_verified', 'other_identity_concerns',
            'taxInvestigationCover', 'isVatInvoiceRequired', 'isStatementRequired'
        ]
        
        for field in bool_fields:
            value = getattr(applicant_data, field, 'no')
            data[field] = 1 if str(value).lower() == 'yes' else 0
        
        # Add categorical fields
        categorical_fields = {
            'businessType': getattr(applicant_data, 'businessType', ''),
            'contactType': getattr(applicant_data, 'contactType', ''),
            'country': getattr(applicant_data, 'country', ''),
            'gender': getattr(applicant_data, 'gender', ''),
            'taxType': getattr(applicant_data, 'taxType', '')
        }
        for field, value in categorical_fields.items():
            data[field] = value
        
        # Create DataFrame
        df = pd.DataFrame([data])
        
        # Add engineered features
        df['total_fees'] = df['recurring_fees'] + df['non_recurring_fees']
        df['identity_risk'] = (
            df['identity_verified'].astype(float) +
            df['evidence_recorded'].astype(float) +
            df['beneficial_owners_verified'].astype(float)
        ) / 3
        
        # Transform features using the preprocessor
        X = self.preprocessor.transform(df)
        
        # Predict risk score (0-100 scale)
        risk_score = float(self.model.predict(X)[0] * 100)
        
        return {'risk_score': risk_score}

def load_applications():
    """Load sample applications to test"""
    # Create test applications that match all form fields
    applications = [
        {
            # Client Details Form
            'title': 'Mr',
            'firstName': 'John',
            'lastName': 'Smith',
            'middleName': '',
            'salutation': 'Mr Smith',
            'gender': 'Male',
            'addressLine1': '123 Business St',
            'addressLine2': '',
            'town': 'London',
            'county': 'Greater London',
            'country': 'United Kingdom',
            'postcode': 'EC1A 1BB',
            'dob': '1980-01-01',
            'telephone1': '02012345678',
            'telephone2': '',
            'mobile': '07700900123',
            'emailCorrespondence': 'john@smith-partners.com',
            
            # Business Details
            'businessType': 'Partnership',
            'contactType': 'Primary',
            'companyName': 'Smith & Partners',
            'registrationNumber': '12345678',
            'professionalReferral': 'yes',
            'referredBy': 'ABC Accountants',
            
            # Tax Details
            'taxType': 'Company',
            'vatNumber': 'GB123456789',
            'niNumber': 'AB123456C',
            'utr': '1234567890',
            'yearEnd': '2024-03-31',
            'taxInvestigationCover': 'yes',
            'isVatInvoiceRequired': 'yes',
            'isStatementRequired': 'yes',
            
            # Financial Details
            'recurring_fees': 50000,
            'non_recurring_fees': 3190,
            'number_of_associations': 2,
            
            # Risk Assessment Questions
            'met_face_to_face': 'yes',
            'visited_business_address': 'yes',
            'is_uk_resident': 'yes',
            'is_uk_national': 'yes',
            'known_to_partner': 'no',
            'reputable_referral': 'yes',
            'plausible_wealth_level': 'yes',
            
            # KYC Questions
            'identity_verified': 'yes',
            'evidence_recorded': 'yes',
            'client_honest_assessment': 'yes',
            'wealth_plausible': 'yes',
            'adverse_records': 'no',
            'beneficial_owners_verified': 'yes',
            'other_identity_concerns': 'no',
            
            # Non-Audit Questions
            'previous_accountant': 'yes',
            'change_reason_explained': 'yes',
            'introduction_source': 'Professional Referral',
            'firm_choice_reason': 'Expertise in partnerships',
            
            # Comments and Notes
            'identity_verification_notes': 'All identity documents verified and validated. Clear passport and proof of address provided.',
            'wealth_assessment_notes': 'Source of wealth clearly documented through business activities and previous tax returns.',
            'adverse_records_notes': 'No adverse findings in background checks.',
            'beneficial_owners_notes': 'All beneficial owners verified with complete documentation.',
            'face_to_face_notes': 'Met client at their office, confirmed business operations.',
            'business_visit_notes': 'Modern office space with active staff, matches reported business size.',
            'referral_notes': 'Referred by ABC Accountants, long-standing relationship.',
            'previous_accountant_notes': 'Clean handover from previous accountant, no issues reported.',
            'change_reason_notes': 'Seeking more specialized partnership expertise.',
            'firm_choice_notes': 'Selected for our partnership tax specialization.'
        },
        {
            # Client Details Form
            'title': 'Mrs',
            'firstName': 'Sarah',
            'lastName': 'Johnson',
            'middleName': 'Elizabeth',
            'salutation': 'Mrs Johnson',
            'gender': 'Female',
            'addressLine1': '456 Corporate House',
            'addressLine2': 'Business Park',
            'town': 'Manchester',
            'county': 'Greater Manchester',
            'country': 'United Kingdom',
            'postcode': 'M1 1AA',
            'dob': '1985-06-15',
            'telephone1': '01612345678',
            'telephone2': '',
            'mobile': '07700900456',
            'emailCorrespondence': 'sarah@johnson-consulting.com',
            
            # Business Details
            'businessType': 'Limited Company',
            'contactType': 'Primary',
            'companyName': 'Johnson Consulting Ltd',
            'registrationNumber': '87654321',
            'professionalReferral': 'no',
            'referredBy': 'Website',
            
            # Tax Details
            'taxType': 'Individual',
            'vatNumber': 'GB987654321',
            'niNumber': 'CD987654A',
            'utr': '9876543210',
            'yearEnd': '2024-04-30',
            'taxInvestigationCover': 'no',
            'isVatInvoiceRequired': 'yes',
            'isStatementRequired': 'yes',
            
            # Financial Details
            'recurring_fees': 1500,
            'non_recurring_fees': 500,
            'number_of_associations': 1,
            
            # Risk Assessment Questions
            'met_face_to_face': 'yes',
            'visited_business_address': 'yes',
            'is_uk_resident': 'yes',
            'is_uk_national': 'yes',
            'known_to_partner': 'yes',
            'reputable_referral': 'yes',
            'plausible_wealth_level': 'yes',
            
            # KYC Questions
            'identity_verified': 'yes',
            'evidence_recorded': 'yes',
            'client_honest_assessment': 'yes',
            'wealth_plausible': 'yes',
            'adverse_records': 'no',
            'beneficial_owners_verified': 'yes',
            'other_identity_concerns': 'no',
            
            # Non-Audit Questions
            'previous_accountant': 'yes',
            'change_reason_explained': 'yes',
            'introduction_source': 'Website',
            'firm_choice_reason': 'Location and services',
            
            # Comments and Notes
            'identity_verification_notes': 'Standard identity verification completed. Documents in order.',
            'wealth_assessment_notes': 'Simple business structure with straightforward revenue streams.',
            'adverse_records_notes': 'No concerns or adverse findings.',
            'beneficial_owners_notes': 'Single owner-director structure, all verified.',
            'face_to_face_notes': 'Met at our office for initial consultation.',
            'business_visit_notes': 'Small but professional office setup.',
            'referral_notes': 'Found through website search, good initial impression.',
            'previous_accountant_notes': 'Standard handover from previous accountant.',
            'change_reason_notes': 'Looking for more local accountant.',
            'firm_choice_notes': 'Chose us for proximity and service range.'
        },
        {
            # Client Details Form
            'title': 'Mr',
            'firstName': 'Ivan',
            'lastName': 'Petrov',
            'middleName': '',
            'salutation': 'Mr Petrov',
            'gender': 'Male',
            'addressLine1': '789 International Plaza',
            'addressLine2': '',
            'town': 'Moscow',
            'county': '',
            'country': 'Russia',
            'postcode': '123456',
            'dob': '1975-12-31',
            'telephone1': '+74951234567',
            'telephone2': '',
            'mobile': '+79001234567',
            'emailCorrespondence': 'ivan@petrov-holdings.ru',
            
            # Business Details
            'businessType': 'Limited Company',
            'contactType': 'Primary',
            'companyName': 'Petrov Holdings',
            'registrationNumber': 'RU9876543',
            'professionalReferral': 'no',
            'referredBy': 'Direct Enquiry',
            
            # Tax Details
            'taxType': 'Trust',
            'vatNumber': '',
            'niNumber': '',
            'utr': '',
            'yearEnd': '2024-12-31',
            'taxInvestigationCover': 'yes',
            'isVatInvoiceRequired': 'yes',
            'isStatementRequired': 'yes',
            
            # Financial Details
            'recurring_fees': 35000,
            'non_recurring_fees': 5000,
            'number_of_associations': 3,
            
            # Risk Assessment Questions
            'met_face_to_face': 'no',
            'visited_business_address': 'no',
            'is_uk_resident': 'no',
            'is_uk_national': 'no',
            'known_to_partner': 'no',
            'reputable_referral': 'no',
            'plausible_wealth_level': 'yes',
            
            # KYC Questions
            'identity_verified': 'no',
            'evidence_recorded': 'yes',
            'client_honest_assessment': 'yes',
            'wealth_plausible': 'yes',
            'adverse_records': 'yes',
            'beneficial_owners_verified': 'no',
            'other_identity_concerns': 'yes',
            
            # Non-Audit Questions
            'previous_accountant': 'no',
            'change_reason_explained': 'yes',
            'introduction_source': 'Direct Enquiry',
            'firm_choice_reason': 'International expertise',
            
            # Comments and Notes
            'identity_verification_notes': 'Complex ownership structure through multiple offshore entities. Pending verification of some documents.',
            'wealth_assessment_notes': 'Unusual transaction patterns noted. Source of wealth unclear for some investments.',
            'adverse_records_notes': 'Multiple regulatory investigations in home country. PEP connections identified.',
            'beneficial_owners_notes': 'Complex nominee structure, some beneficial owners yet to be fully verified.',
            'face_to_face_notes': 'Remote communication only, citing international travel restrictions.',
            'business_visit_notes': 'Unable to verify physical business presence.',
            'referral_notes': 'Direct approach without professional referral.',
            'previous_accountant_notes': 'No previous accountant relationship disclosed.',
            'change_reason_notes': 'Seeking UK presence for international expansion.',
            'firm_choice_notes': 'Specifically requested services for complex international structures.'
        }
    ]
    
    return [SimpleNamespace(**app) for app in applications]

def get_risk_label(score):
    """Convert risk score to risk label"""
    if score >= HIGH_RISK_THRESHOLD:
        return "High"
    elif score >= MEDIUM_RISK_THRESHOLD:
        return "Medium"
    else:
        return "Low"

def main():
    print("Loading applications...")
    applications = load_applications()
    
    if not applications:
        print("No applications found to test.")
        return
    
    print(f"\nFound {len(applications)} applications to evaluate.")
    
    print("\nInitializing risk scorer...")
    risk_scorer = RiskScorer()
    
    print("\nEvaluating applications:")
    print("-" * 80)
    
    for i, app in enumerate(applications, 1):
        try:
            # Get risk score
            risk_result = risk_scorer.score_applicant(app)
            risk_score = risk_result.get('risk_score', 0)
            risk_label = get_risk_label(risk_score)
            
            # Get key risk factors
            key_factors = []
            if not app.is_uk_resident:
                key_factors.append("Non-UK resident")
            if app.adverse_records == "yes":
                key_factors.append("Has adverse records")
            if app.other_identity_concerns == "yes":
                key_factors.append("Identity concerns")
            if not app.identity_verified:
                key_factors.append("Identity not verified")
            
            print(f"\nApplication {i}:")
            print(f"Business Type: {app.businessType}")
            print(f"Country: {app.country}")
            print(f"Tax Type: {app.taxType}")
            print(f"Total Fees: £{app.recurring_fees + app.non_recurring_fees:,.2f}")
            print(f"Key Risk Factors: {', '.join(key_factors) if key_factors else 'None'}")
            print(f"Predicted Risk Score: {risk_score:.1f}")
            print(f"Risk Label: {risk_label}")
            print("-" * 40)
            
        except Exception as e:
            print(f"\nError evaluating application {i}: {e}")
            print("-" * 40)

if __name__ == "__main__":
    main()
