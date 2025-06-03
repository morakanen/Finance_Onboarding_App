"""
Configuration settings for ML risk assessment system.
This centralizes all settings to make the system more maintainable.
"""

import os

# Base directory for ML assets
ML_DIR = os.path.dirname(os.path.abspath(__file__))

# File paths
SYNTHETIC_DATA_PATH = os.path.join(ML_DIR, "synthetic_applicants.csv")
XGBOOST_MODEL_PATH = os.path.join(ML_DIR, "xgboost_risk_model.json")
MODEL_PATH = os.path.join(ML_DIR, "risk_model.pkl")  # Legacy model path
VECTORIZER_PATH = os.path.join(ML_DIR, "text_vectorizer.pkl")  # For text analysis
ENCODER_PATH = os.path.join(ML_DIR, "categorical_encoder.pkl")  # For categorical features
SCALER_PATH = os.path.join(ML_DIR, "feature_scaler.pkl")
FEATURE_NAMES_PATH = os.path.join(ML_DIR, "feature_names.json")
SAMPLE_JSON_PATH = os.path.join(ML_DIR, "sample_applicant.json")

# Data generation settings
NUM_SYNTHETIC_RECORDS = 1000

# Risk assessment thresholds
HIGH_RISK_THRESHOLD = 70
MEDIUM_RISK_THRESHOLD = 40

# Risk-related country lists
HIGH_RISK_COUNTRIES = ["afghanistan", "north korea", "iran", "iraq", "syria", "sudan", "somalia", "yemen"]
MEDIUM_RISK_COUNTRIES = ["russia", "belarus", "venezuela", "myanmar", "cuba", "zimbabwe"]

# Feature definitions
CATEGORICAL_FEATURES = [
    'businessType',
    'contactType',
    'country',
    'gender',
    'taxType'
]

BINARY_FEATURES = [
    'met_face_to_face',
    'visited_business_address',
    'is_uk_resident',
    'is_uk_national',
    'known_to_partner',
    'reputable_referral',
    'plausible_wealth_level',
    'identity_verified',
    'evidence_recorded',
    'client_honest_assessment',
    'wealth_plausible',
    'adverse_records',
    'beneficial_owners_verified',
    'other_identity_concerns',
    'taxInvestigationCover',
    'isVatInvoiceRequired',
    'isStatementRequired'
]

# Text features for NLP analysis
TEXT_FEATURES = [
    'risk_q1_response',
    'risk_q2_response',
    'risk_q3_response',
    'risk_q4_response',
    'risk_q5_response',
    'risk_q6_response',
    'risk_q7_response'
]

NUMERIC_FEATURES = [
    'recurring_fees',
    'non_recurring_fees',
    'number_of_associations'
]

# Risk assessment configuration
HIGH_RISK_COUNTRIES = ['Nigeria', 'Russia', 'China', 'Iran', 'North Korea']
MEDIUM_RISK_COUNTRIES = ['India', 'Pakistan', 'Turkey', 'Mexico', 'Brazil']

HIGH_RISK_SECTORS = ['Gambling', 'Cryptocurrency', 'Adult Entertainment', 'Precious Metals', 'Defense']  
MEDIUM_RISK_SECTORS = ['Finance', 'Real Estate', 'Art', 'Jewelry', 'Cash Businesses']

# Risk scoring thresholds
HIGH_RISK_THRESHOLD = 70
MEDIUM_RISK_THRESHOLD = 40

# API settings
RISK_ASSESSMENT_ENDPOINT = "/api/applications/{application_id}/risk-score"
