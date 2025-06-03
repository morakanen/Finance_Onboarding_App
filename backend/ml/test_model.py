"""
Test the trained XGBoost risk assessment model with example cases.
"""

import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
from config import (
    XGBOOST_MODEL_PATH,
    SCALER_PATH,
    FEATURE_NAMES_PATH
)

def create_test_cases():
    """Create diverse test cases to evaluate the model"""
    test_cases = [
        {
            # Low Risk Case: UK-based established business
            "title": "Low Risk - UK Business",
            "gender": "Male",
            "country": "United Kingdom",
            "taxType": "Individual",
            "taxInvestigationCover": True,
            "isVatInvoiceRequired": True,
            "isStatementRequired": True,
            "businessType": "Limited Company",
            "contactType": "Primary",
            "recurring_fees": 500,
            "non_recurring_fees": 1000,
            "number_of_associations": 2,
            "met_face_to_face": True,
            "visited_business_address": True,
            "is_uk_resident": True,
            "is_uk_national": True,
            "known_to_partner": True,
            "reputable_referral": True,
            "plausible_wealth_level": True,
            "identity_verified": True,
            "evidence_recorded": True,
            "client_honest_assessment": True,
            "wealth_plausible": True,
            "adverse_records": False,
            "beneficial_owners_verified": True,
            "other_identity_concerns": False
        },
        {
            # Medium Risk Case: Non-UK but established business
            "title": "Medium Risk - EU Business",
            "gender": "Female",
            "country": "Germany",
            "taxType": "Partnership",
            "taxInvestigationCover": True,
            "isVatInvoiceRequired": True,
            "isStatementRequired": True,
            "businessType": "Partnership",
            "contactType": "Primary",
            "recurring_fees": 1000,
            "non_recurring_fees": 2000,
            "number_of_associations": 3,
            "met_face_to_face": False,
            "visited_business_address": False,
            "is_uk_resident": False,
            "is_uk_national": False,
            "known_to_partner": False,
            "reputable_referral": True,
            "plausible_wealth_level": True,
            "identity_verified": True,
            "evidence_recorded": True,
            "client_honest_assessment": True,
            "wealth_plausible": True,
            "adverse_records": False,
            "beneficial_owners_verified": True,
            "other_identity_concerns": False
        },
        {
            # High Risk Case: High-risk jurisdiction with red flags
            "title": "High Risk - Complex Case",
            "gender": "Prefer not to say",
            "country": "Russia",
            "taxType": "Trust",
            "taxInvestigationCover": False,
            "isVatInvoiceRequired": False,
            "isStatementRequired": False,
            "businessType": "Limited Company",
            "contactType": "Secondary",
            "recurring_fees": 5000,
            "non_recurring_fees": 10000,
            "number_of_associations": 10,
            "met_face_to_face": False,
            "visited_business_address": False,
            "is_uk_resident": False,
            "is_uk_national": False,
            "known_to_partner": False,
            "reputable_referral": False,
            "plausible_wealth_level": False,
            "identity_verified": False,
            "evidence_recorded": True,
            "client_honest_assessment": False,
            "wealth_plausible": False,
            "adverse_records": True,
            "beneficial_owners_verified": False,
            "other_identity_concerns": True
        }
    ]
    return pd.DataFrame(test_cases)

def preprocess_test_cases(df, preprocessor):
    """Preprocess test cases using the saved preprocessor"""
    # Add engineered features
    df['total_fees'] = df['recurring_fees'] + df['non_recurring_fees']
    df['identity_risk'] = (
        df['identity_verified'].astype(float) +
        df['evidence_recorded'].astype(float) +
        df['beneficial_owners_verified'].astype(float)
    ) / 3
    
    # Convert boolean columns to int
    bool_columns = [
        'taxInvestigationCover', 'isVatInvoiceRequired', 'isStatementRequired',
        'met_face_to_face', 'visited_business_address', 'is_uk_resident',
        'is_uk_national', 'known_to_partner', 'reputable_referral',
        'plausible_wealth_level', 'identity_verified', 'evidence_recorded',
        'client_honest_assessment', 'wealth_plausible', 'adverse_records',
        'beneficial_owners_verified', 'other_identity_concerns'
    ]
    for col in bool_columns:
        df[col] = df[col].astype(int)
    
    # Transform features using the preprocessor
    return preprocessor.transform(df)

def get_risk_label(score):
    """Convert risk score to risk label"""
    if score >= 80:
        return "High"
    elif score >= 50:
        return "Medium"
    else:
        return "Low"

def main():
    print("Loading model and preprocessor...")
    model = xgb.XGBRegressor()
    model.load_model(XGBOOST_MODEL_PATH)
    preprocessor = joblib.load(SCALER_PATH)
    
    print("\nCreating test cases...")
    test_cases = create_test_cases()
    
    print("\nPreprocessing test cases...")
    X_test = preprocess_test_cases(test_cases, preprocessor)
    
    print("\nMaking predictions...")
    predictions = model.predict(X_test)
    
    print("\nTest Results:")
    print("-" * 80)
    for i, (_, case) in enumerate(test_cases.iterrows()):
        # Convert normalized prediction back to 0-100 scale
        risk_score = predictions[i] * 100
        risk_label = get_risk_label(risk_score)
        
        print(f"\nCase {i+1}: {case['title']}")
        print(f"Business Type: {case['businessType']}")
        print(f"Country: {case['country']}")
        print(f"Tax Type: {case['taxType']}")
        print(f"Identity Risk Score: {case['identity_risk']*100:.1f}")
        print(f"Total Fees: £{case['recurring_fees'] + case['non_recurring_fees']:,}")
        print(f"Predicted Risk Score: {risk_score:.1f}")
        print(f"Risk Label: {risk_label}")
        print("-" * 40)

if __name__ == "__main__":
    main()
