"""
Risk scoring module for the ML risk assessment system.
This module loads the trained ML model and provides functions to score an applicant's risk.
"""

import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, Optional, List, Union
from .config import (
    MODEL_PATH, 
    VECTORIZER_PATH, 
    ENCODER_PATH,
    FEATURE_NAMES_PATH,
    TEXT_FEATURES,
    CATEGORICAL_FEATURES,
    HIGH_RISK_THRESHOLD,
    MEDIUM_RISK_THRESHOLD
)

class RiskScorer:
    """Risk assessment scorer that uses both ML and rule-based approaches"""
    
    def __init__(self):
        self.model = None
        self.tfidf_vectorizer = None
        self.categorical_encoder = None
        self.feature_names = None
        
        # Try to load the ML model and components
        self.ml_available = self._load_ml_components()
    
    def _load_ml_components(self) -> bool:
        """Load ML model and components, return True if successful"""
        try:
            if os.path.exists(MODEL_PATH):
                self.model = joblib.load(MODEL_PATH)
            
            if os.path.exists(VECTORIZER_PATH):
                self.tfidf_vectorizer = joblib.load(VECTORIZER_PATH)
                
            if os.path.exists(ENCODER_PATH):
                self.categorical_encoder = joblib.load(ENCODER_PATH)
                
            if os.path.exists(FEATURE_NAMES_PATH):
                self.feature_names = joblib.load(FEATURE_NAMES_PATH)
            
            # Check if all components are loaded
            if all([self.model, self.tfidf_vectorizer, self.categorical_encoder, self.feature_names]):
                print("All ML components loaded successfully")
                return True
            else:
                missing = []
                if not self.model:
                    missing.append("model")
                if not self.tfidf_vectorizer:
                    missing.append("tfidf_vectorizer")
                if not self.categorical_encoder:
                    missing.append("categorical_encoder")
                if not self.feature_names:
                    missing.append("feature_names")
                print(f"Some ML components could not be loaded: {', '.join(missing)}")
                return False
                
        except Exception as e:
            print(f"Error loading ML components: {e}")
            return False
    
    def _calculate_rule_based_score(self, applicant: Dict[str, Any]) -> Tuple[str, int]:
        """Calculate risk score using rule-based approach"""
        score = 50  # Start at neutral
        
        # Country risk (0-25 points)
        country = applicant.get('country', '')
        from .config import HIGH_RISK_COUNTRIES, MEDIUM_RISK_COUNTRIES
        if country in HIGH_RISK_COUNTRIES:
            score += 25
        elif country in MEDIUM_RISK_COUNTRIES:
            score += 15
        elif country not in ['United Kingdom', 'United States', 'France', 'Germany']:
            score += 5
            
        # Business type risk (0-10 points)
        business_type = applicant.get('businessType', '')
        if business_type == 'Sole Trader':
            score += 10
        elif business_type == 'Partnership':
            score += 8
        elif business_type == 'LLP':
            score += 5
        elif business_type == 'Limited Company':
            score += 3
            
        # Sector risk (0-20 points)
        sector = applicant.get('sector', '')
        from .config import HIGH_RISK_SECTORS, MEDIUM_RISK_SECTORS
        if sector in HIGH_RISK_SECTORS:
            score += 20
        elif sector in MEDIUM_RISK_SECTORS:
            score += 10
            
        # Risk question responses (0-35 points)
        for i in range(1, 8):
            if applicant.get(f'risk_q{i}_response', '') == 'no':
                score += 5  # 5 points per 'no' answer
                
        # Normalize to 0-100
        score = max(0, min(100, score))
        
        # Assign category based on thresholds from config
        if score >= HIGH_RISK_THRESHOLD:
            return 'High', score
        elif score >= MEDIUM_RISK_THRESHOLD:
            return 'Medium', score
        else:
            return 'Low', score
    
    def _predict_with_ml_model(self, applicant: Dict[str, Any]) -> Optional[str]:
        """Make prediction using the ML model"""
        if not self.ml_available:
            return None
        
        try:
            # Prepare the data in the format expected by the model
            # Extract categorical features
            categorical_data = {}
            for feature in self.feature_names['categorical']:
                categorical_data[feature] = [applicant.get(feature, '')]
                
            df_cat = pd.DataFrame(categorical_data)
            
            # Combine text features into one field
            text_fields = [applicant.get(field, '') for field in self.feature_names['text']]
            all_comments = ' '.join([str(field) for field in text_fields])
            
            # Create a DataFrame with the structure expected by the model
            input_data = df_cat.copy()
            input_data['all_comments'] = all_comments
            
            # Make prediction
            prediction = self.model.predict(input_data)
            return prediction[0]
            
        except Exception as e:
            print(f"Error making ML prediction: {e}")
            return None
            
    def score_applicant(self, applicant: Dict[str, Any]) -> Dict[str, Any]:
        """
        Score an applicant's risk using the best available method.
        If the ML model is available and works, use it. Otherwise, fall back to rule-based.
        
        Returns a dict with risk_label, risk_score, and scoring_method.
        """
        result = {}
        
        # Try ML model first if available
        ml_prediction = None
        if self.ml_available:
            ml_prediction = self._predict_with_ml_model(applicant)
        
        # If ML worked, use that result
        if ml_prediction is not None:
            result['risk_label'] = ml_prediction
            result['scoring_method'] = 'machine_learning'
            # Calculate a score range based on the label since ML might not provide a numerical score
            if ml_prediction == 'High':
                result['risk_score'] = random.randint(HIGH_RISK_THRESHOLD, 100)
            elif ml_prediction == 'Medium':
                result['risk_score'] = random.randint(MEDIUM_RISK_THRESHOLD, HIGH_RISK_THRESHOLD-1)
            else:  # Low
                result['risk_score'] = random.randint(0, MEDIUM_RISK_THRESHOLD-1)
        else:
            # Fall back to rule-based approach
            risk_label, risk_score = self._calculate_rule_based_score(applicant)
            result['risk_label'] = risk_label
            result['risk_score'] = risk_score
            result['scoring_method'] = 'rule_based'
        
        # Add a breakdown of identified risk factors
        result['risk_factors'] = self._identify_risk_factors(applicant)
        
        return result
    
    def _identify_risk_factors(self, applicant: Dict[str, Any]) -> List[Dict[str, str]]:
        """Identify specific risk factors for the applicant"""
        risk_factors = []
        
        # Check country risk
        country = applicant.get('country', '')
        from .config import HIGH_RISK_COUNTRIES, MEDIUM_RISK_COUNTRIES
        if country in HIGH_RISK_COUNTRIES:
            risk_factors.append({
                'type': 'country',
                'severity': 'high',
                'description': f"High-risk jurisdiction: {country}"
            })
        elif country in MEDIUM_RISK_COUNTRIES:
            risk_factors.append({
                'type': 'country',
                'severity': 'medium',
                'description': f"Medium-risk jurisdiction: {country}"
            })
            
        # Check sector risk
        sector = applicant.get('sector', '')
        from .config import HIGH_RISK_SECTORS, MEDIUM_RISK_SECTORS
        if sector in HIGH_RISK_SECTORS:
            risk_factors.append({
                'type': 'sector',
                'severity': 'high',
                'description': f"High-risk business sector: {sector}"
            })
        elif sector in MEDIUM_RISK_SECTORS:
            risk_factors.append({
                'type': 'sector',
                'severity': 'medium',
                'description': f"Medium-risk business sector: {sector}"
            })
            
        # Check risk assessment answers
        for i in range(1, 8):
            if applicant.get(f'risk_q{i}_response', '') == 'no':
                risk_factors.append({
                    'type': 'assessment',
                    'severity': 'medium',
                    'description': f"Negative response to risk question {i}: {applicant.get(f'risk_q{i}_comment', '')}"
                })
                
        return risk_factors

# Initialize a global instance of the risk scorer
risk_scorer = RiskScorer()

def score_applicant(applicant_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Public function to score an applicant's risk.
    This is the main entry point for other modules.
    """
    import random  # Import here to avoid global import issues
    return risk_scorer.score_applicant(applicant_data)

def get_risk_categories() -> Dict[str, Dict[str, Union[int, str]]]:
    """Return information about risk categories and thresholds"""
    return {
        'High': {
            'threshold': HIGH_RISK_THRESHOLD,
            'description': 'High risk clients require enhanced due diligence and senior management approval',
            'color': '#EF4444'  # Red color for high risk
        },
        'Medium': {
            'threshold': MEDIUM_RISK_THRESHOLD,
            'description': 'Medium risk clients require standard due diligence measures',
            'color': '#F59E0B'  # Amber color for medium risk
        },
        'Low': {
            'threshold': 0,
            'description': 'Low risk clients require simplified due diligence',
            'color': '#10B981'  # Green color for low risk
        }
    }
