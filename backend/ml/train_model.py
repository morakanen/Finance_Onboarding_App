"""
Train ML model for risk assessment using synthetic data.
"""

import os
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
import joblib
from config import (
    SYNTHETIC_DATA_PATH,
    MODEL_PATH,
    VECTORIZER_PATH,
    ENCODER_PATH,
    FEATURE_NAMES_PATH,
    TEXT_FEATURES,
    CATEGORICAL_FEATURES,
    HIGH_RISK_COUNTRIES,
    MEDIUM_RISK_COUNTRIES,
    HIGH_RISK_SECTORS,
    MEDIUM_RISK_SECTORS,
    NUM_SYNTHETIC_RECORDS
)

def generate_synthetic_data():
    """Generate synthetic applicant data for training"""
    data = []
    
    # Risk levels and their probabilities
    risk_levels = ['Low', 'Medium', 'High']
    risk_probs = [0.6, 0.3, 0.1]  # Most applicants should be low risk
    
    for _ in range(NUM_SYNTHETIC_RECORDS):
        risk_level = np.random.choice(risk_levels, p=risk_probs)
        
        # Generate data based on risk level
        if risk_level == 'High':
            country = np.random.choice(HIGH_RISK_COUNTRIES)
            sector = np.random.choice(HIGH_RISK_SECTORS)
            risk_score = np.random.uniform(70, 100)
        elif risk_level == 'Medium':
            country = np.random.choice(MEDIUM_RISK_COUNTRIES)
            sector = np.random.choice(MEDIUM_RISK_SECTORS)
            risk_score = np.random.uniform(40, 70)
        else:  # Low risk
            country = np.random.choice(['UK', 'US', 'Canada', 'Germany', 'France'])
            sector = np.random.choice(['Technology', 'Education', 'Healthcare', 'Manufacturing', 'Retail'])
            risk_score = np.random.uniform(0, 40)
        
        # Generate other fields
        record = {
            'country': country,
            'sector': sector,
            'businessType': np.random.choice(['Limited Company', 'Partnership', 'Sole Trader']),
            'contactType': np.random.choice(['Director', 'Partner', 'Owner']),
            'introductoryCategory': np.random.choice(['Direct', 'Professional Referral', 'Client Referral']),
            'gender': np.random.choice(['Male', 'Female', 'Other']),
            'risk_score': risk_score
        }
        
        # Generate risk assessment comments
        for i in range(7):
            response = 'yes' if np.random.random() > 0.3 else 'no'
            if risk_level == 'High':
                comment = np.random.choice([
                    "Significant concerns identified",
                    "Multiple red flags present",
                    "Requires enhanced due diligence",
                    "Complex ownership structure",
                    "Unusual transaction patterns"
                ])
            elif risk_level == 'Medium':
                comment = np.random.choice([
                    "Some concerns noted",
                    "Additional verification required",
                    "Minor discrepancies found",
                    "Moderate complexity",
                    "Further investigation needed"
                ])
            else:
                comment = np.random.choice([
                    "No concerns identified",
                    "Standard verification complete",
                    "Clear documentation provided",
                    "Straightforward structure",
                    "All requirements met"
                ])
            record[f'risk_q{i+1}_response'] = response
            record[f'risk_q{i+1}_comment'] = comment
        
        data.append(record)
    
    return pd.DataFrame(data)

def train_model(df):
    """Train ML model on synthetic data"""
    # Process text features
    tfidf = TfidfVectorizer(max_features=100)
    text_features = tfidf.fit_transform(df[TEXT_FEATURES].fillna('').agg(' '.join, axis=1))
    
    # Process categorical features
    encoder = LabelEncoder()
    cat_features = np.vstack([
        encoder.fit_transform(df[col])
        for col in CATEGORICAL_FEATURES
    ]).T
    
    # Combine features
    X = np.hstack([text_features.toarray(), cat_features])
    y = df['risk_score']
    
    # Train model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Save feature names
    feature_names = (
        [f"tfidf_{i}" for i in range(text_features.shape[1])] +
        CATEGORICAL_FEATURES
    )
    
    return model, tfidf, encoder, feature_names

def main():
    """Main training function"""
    print("Generating synthetic data...")
    df = generate_synthetic_data()
    df.to_csv(SYNTHETIC_DATA_PATH, index=False)
    print(f"Saved synthetic data to {SYNTHETIC_DATA_PATH}")
    
    print("\nTraining model...")
    model, tfidf, encoder, feature_names = train_model(df)
    
    # Save model and components
    joblib.dump(model, MODEL_PATH)
    joblib.dump(tfidf, VECTORIZER_PATH)
    joblib.dump(encoder, ENCODER_PATH)
    joblib.dump(feature_names, FEATURE_NAMES_PATH)
    
    print("\nSaved model components:")
    print(f"- Model: {MODEL_PATH}")
    print(f"- TF-IDF vectorizer: {VECTORIZER_PATH}")
    print(f"- Label encoder: {ENCODER_PATH}")
    print(f"- Feature names: {FEATURE_NAMES_PATH}")

if __name__ == '__main__':
    main()
