"""
Configuration settings for ML risk assessment system.
This centralizes all settings to make the system more maintainable.
"""

import os

# Base directory for ML assets
ML_DIR = os.path.dirname(os.path.abspath(__file__))

# File paths
SYNTHETIC_DATA_PATH = os.path.join(ML_DIR, "synthetic_applicants.csv")
MODEL_PATH = os.path.join(ML_DIR, "risk_model.pkl")
VECTORIZER_PATH = os.path.join(ML_DIR, "tfidf_vectorizer.pkl")
ENCODER_PATH = os.path.join(ML_DIR, "categorical_encoder.pkl")
FEATURE_NAMES_PATH = os.path.join(ML_DIR, "feature_names.pkl")
SAMPLE_JSON_PATH = os.path.join(ML_DIR, "sample_applicant.json")

# Data generation settings
NUM_SYNTHETIC_RECORDS = 1000

# Feature definitions
TEXT_FEATURES = [f"risk_q{i+1}_comment" for i in range(7)]
CATEGORICAL_FEATURES = [
    "country",
    "sector", 
    "businessType", 
    "contactType", 
    "introductoryCategory",
    "gender"
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
