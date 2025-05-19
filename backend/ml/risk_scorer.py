"""
Risk scoring module for the ML risk assessment system.
This module loads the trained ML model and provides functions to score an applicant's risk.
"""

import os
import joblib
import pandas as pd
import numpy as np
import random
import logging
import traceback
from typing import Dict, Any, Tuple, Optional, List, Union
from .config import (
    MODEL_PATH, 
    VECTORIZER_PATH, 
    ENCODER_PATH,
    FEATURE_NAMES_PATH,
    TEXT_FEATURES,
    CATEGORICAL_FEATURES,
    HIGH_RISK_THRESHOLD,
    MEDIUM_RISK_THRESHOLD,
    HIGH_RISK_COUNTRIES,
    MEDIUM_RISK_COUNTRIES
)

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
    logger.addHandler(handler)

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
            logger.info("\nAttempting to load ML components...")
            ml_dir = os.path.dirname(os.path.abspath(__file__))
            logger.info(f"MODEL_PATH: {MODEL_PATH}")
            logger.info(f"VECTORIZER_PATH: {VECTORIZER_PATH}")
            logger.info(f"Current directory: {os.getcwd()}")
            logger.info(f"ML_DIR: {ml_dir}")
            logger.info(f"Directory contents: {os.listdir(ml_dir)}")
            logger.info(f"ENCODER_PATH: {ENCODER_PATH}")
            logger.info(f"FEATURE_NAMES_PATH: {FEATURE_NAMES_PATH}")
            
            if os.path.exists(MODEL_PATH):
                print("Loading model...")
                self.model = joblib.load(MODEL_PATH)
                print(f"Model loaded successfully. Type: {type(self.model)}")
            else:
                print(f"Model file not found at {MODEL_PATH}")
            
            if os.path.exists(VECTORIZER_PATH):
                logger.info("Loading vectorizer...")
                self.tfidf_vectorizer = joblib.load(VECTORIZER_PATH)
                logger.info(f"Vectorizer loaded successfully. Type: {type(self.tfidf_vectorizer)}")
            else:
                print(f"Vectorizer file not found at {VECTORIZER_PATH}")
                
            if os.path.exists(ENCODER_PATH):
                logger.info("Loading encoder...")
                self.categorical_encoder = joblib.load(ENCODER_PATH)
                logger.info(f"Encoder loaded successfully. Type: {type(self.categorical_encoder)}")
            else:
                print(f"Encoder file not found at {ENCODER_PATH}")
                
            if os.path.exists(FEATURE_NAMES_PATH):
                logger.info("Loading feature names...")
                self.feature_names = joblib.load(FEATURE_NAMES_PATH)
                logger.info(f"Feature names loaded successfully. Count: {len(self.feature_names)}")
            else:
                print(f"Feature names file not found at {FEATURE_NAMES_PATH}")
            
            # Check if all components are loaded
            components_status = {
                'model': bool(self.model),
                'vectorizer': bool(self.tfidf_vectorizer),
                'encoder': bool(self.categorical_encoder),
                'feature_names': bool(self.feature_names)
            }
            
            if all(components_status.values()):
                logger.info("ML components loaded successfully")
                return True
            else:
                missing = [name for name, status in components_status.items() if not status]
                print(f"\nSome ML components could not be loaded: {', '.join(missing)}")
                return False
                
        except Exception as e:
            logger.error(f"Error loading ML components: {e}")
            logger.error(f"Stack trace:", exc_info=True)
            print(f"\nError loading ML components: {str(e)}")
            print("Traceback:")
            print(traceback.format_exc())
            return False
    
    def _calculate_rule_based_score(self, applicant: Dict[str, Any]) -> Tuple[str, int, List[Dict[str, Any]]]:
        """Calculate risk score using rule-based approach based on actual form fields"""
        # Default starting score - start at 30 for more variability in low scores
        score = 30  # Lower starting point for more variability
        risk_factors = []
        
        # Add small random variation to make scores more unique (-3 to +3)
        score += random.randint(-3, 3)
        
        # Track which fields we successfully evaluated
        evaluated_fields = set()
        
        # Country risk (0-25 points)
        country = applicant.get('country', '').strip()
        logger.info(f"Assessing country risk for: {country}")
        if country:
            evaluated_fields.add('country')
            from .config import HIGH_RISK_COUNTRIES, MEDIUM_RISK_COUNTRIES
            # Apply more granular country risk based on specific countries
            if country in HIGH_RISK_COUNTRIES:
                # Vary the score even within high-risk countries
                high_risk_country_scores = {
                    'Russia': 25,
                    'Nigeria': 23,
                    'China': 22,
                    'Iran': 25,
                    'North Korea': 25
                }
                country_score = high_risk_country_scores.get(country, 20) + random.randint(0, 3)
                score += country_score
                risk_factors.append({
                    'type': 'country',
                    'severity': 'high',
                    'description': f"High-risk jurisdiction: {country}"
                })
                logger.info(f"Added {country_score} points for high-risk country {country}")
            elif country in MEDIUM_RISK_COUNTRIES:
                # Vary the score for medium-risk countries too
                medium_risk_country_scores = {
                    'India': 12,
                    'Pakistan': 15,
                    'Turkey': 14,
                    'Mexico': 13,
                    'Brazil': 11
                }
                country_score = medium_risk_country_scores.get(country, 10) + random.randint(0, 3)
                score += country_score
                risk_factors.append({
                    'type': 'country',
                    'severity': 'medium',
                    'description': f"Medium-risk jurisdiction: {country}"
                })
                logger.info(f"Added {country_score} points for medium-risk country {country}")
            elif country not in ['United Kingdom', 'United States', 'France', 'Germany']:
                score += 5 + random.randint(0, 3)  # Add variability
                logger.info(f"Added 5 points for country {country}")
            else:
                # Low risk countries get a larger variable bonus
                low_risk_country_scores = {
                    'United Kingdom': -8,
                    'United States': -6,
                    'France': -5,
                    'Germany': -5
                }
                country_score = low_risk_country_scores.get(country, -4) + random.randint(-2, 0)
                score += country_score
                logger.info(f"Added {country_score} points for low-risk country {country}")
                
        # Business type risk (0-12 points with variability)
        business_type = applicant.get('businessType', '').strip()
        logger.info(f"Assessing business type risk for: {business_type}")
        if business_type:
            evaluated_fields.add('businessType')
            business_type_scores = {
                'Sole Trader': 10 + random.randint(0, 2),
                'Partnership': 8 + random.randint(0, 2),
                'LLP': 5 + random.randint(-1, 1),
                'Limited Company': -3 + random.randint(-2, 0),
                'Charity': -1 + random.randint(-1, 1)
            }
            business_score = business_type_scores.get(business_type, 0)
            score += business_score
            logger.info(f"Added {business_score} points for business type {business_type}")
            
            if business_type in ['Sole Trader', 'Partnership']:
                risk_factors.append({
                    'type': 'business_type',
                    'severity': 'medium',
                    'description': f"Higher risk business structure: {business_type}"
                })
            
        # Business sector risk (0-20 points with variability)
        sector = applicant.get('sector', '').strip()  # Changed from business_sector to sector
        logger.info(f"Assessing sector risk for: {sector}")
        if sector:
            evaluated_fields.add('sector')
            high_risk_sectors = {
                'Cryptocurrency': 20,
                'Gambling': 18,
                'Adult Entertainment': 17,
                'Arms Trade': 20,
                'Money Services': 15
            }
            medium_risk_sectors = {
                'Finance': 12,
                'Real Estate': 10,
                'Art': 9,
                'Jewelry': 11,
                'Cash Businesses': 13
            }
            low_risk_sectors = {
                'Retail': -6,
                'Education': -8,
                'Healthcare': -7,
                'Technology': -5,
                'Construction': -3
            }
            
            if sector in high_risk_sectors:
                score += high_risk_sectors[sector] + random.randint(0, 2)
                risk_factors.append({
                    'type': 'business_sector',
                    'severity': 'high',
                    'description': f"High-risk business sector: {sector}"
                })
                logger.info(f"Added {high_risk_sectors[sector]} points for high-risk sector {sector}")
            elif sector in medium_risk_sectors:
                score += medium_risk_sectors[sector] + random.randint(0, 2)
                risk_factors.append({
                    'type': 'business_sector',
                    'severity': 'medium',
                    'description': f"Medium-risk business sector: {sector}"
                })
                logger.info(f"Added {medium_risk_sectors[sector]} points for medium-risk sector {sector}")
            elif sector in low_risk_sectors:
                score += low_risk_sectors[sector] + random.randint(-1, 1)
                logger.info(f"Added {low_risk_sectors[sector]} points for low-risk sector {sector}")
            
        # Introductory category risk (0-10 points with variability)
        intro_category = applicant.get('introductoryCategory', '').strip()
        logger.info(f"Assessing introductory category risk for: {intro_category}")
        if intro_category:
            evaluated_fields.add('introductoryCategory')
            intro_scores = {
                'Direct': 5 + random.randint(0, 2),
                'Website': 3 + random.randint(0, 2),
                'Social Media': 2 + random.randint(0, 2),
                'Referral': -5 + random.randint(-2, 0),
                'Other': 1 + random.randint(0, 2)
            }
            score += intro_scores.get(intro_category, 0)
            logger.info(f"Added {intro_scores.get(intro_category, 0)} points for introductory category {intro_category}")
            
            if intro_category in ['Direct', 'Website']:
                risk_factors.append({
                    'type': 'introduction',
                    'severity': 'low',
                    'description': f"Client acquired through {intro_category} channel without personal referral"
                })
                
        # Risk question responses (0-45 points with variability)
        risk_questions_evaluated = 0
        answers = applicant.get('answers', [])
        for i, answer in enumerate(answers, 1):
            response = answer.get('response', '').strip().lower()
            comment = answer.get('comment', '').strip()
            
            if response == 'no':
                severity = 'high' if i in [3, 4, 7] else 'medium'  # Higher severity for certain questions
                risk_factors.append({
                    'type': 'assessment',
                    'severity': severity,
                    'description': f"Negative response: {['Have we met the client face to face?', 'Have we visited the client at their usual residential or business address?', 'Is the client resident in UK?', 'Is client a UK national?', 'Was client previously known to a partner or manager, or is it a well-known local business?', 'Has client been referred by reputable source?', 'Do we have reasonable belief that the client\'s levels of wealth have a plausible explanation?'][i-1]}{' - ' + comment if comment else ''}"
                })
            elif response == 'yes' and ('not' in comment.lower() or 'pending' in comment.lower()):
                # Contradictory comment for 'yes' answer
                risk_factors.append({
                    'type': 'assessment',
                    'severity': 'low',
                    'description': f"Contradictory comment for positive response on question {i}"
                })
            elif response == 'yes':
                # Positive responses reduce the score with variability
                score -= random.randint(1, 2)  # Variable bonus for each 'yes'
                logger.info(f"Subtracted {random.randint(1, 2)} points for positive response on question {i}")
        
        # Tax Info - missing tax info increases risk
        tax_fields = ['vatNumber', 'utr', 'taxType']
        missing_tax_info = all(not applicant.get(field, '').strip() for field in tax_fields)
        if missing_tax_info and business_type in ['Limited Company', 'Partnership', 'LLP']:
            score += 7 + random.randint(0, 3)  # Add variability
            risk_factors.append({
                'type': 'tax',
                'severity': 'high',
                'description': 'Missing tax information for registered business entity'
            })
            logger.info(f"Added {7 + random.randint(0, 3)} points for missing tax info")
        
        # One final bit of minor randomization to ensure unique scores
        if score < HIGH_RISK_THRESHOLD - 3 and score > MEDIUM_RISK_THRESHOLD + 3:
            # For scores not close to thresholds, add more randomness
            score += random.randint(-2, 2)
            logger.info(f"Added {random.randint(-2, 2)} points for final randomization")
        
        # Determine risk label based on score
        risk_label = 'High' if score >= HIGH_RISK_THRESHOLD else \
                    'Medium' if score >= MEDIUM_RISK_THRESHOLD else 'Low'
        
        return risk_label, score, risk_factors
    
    def score_applicant(self, applicant_data: Dict[str, Any]) -> Dict[str, Any]:
        """Score an applicant's risk using the best available method.
        If the ML model is available and works, use it. Otherwise, fall back to rule-based.
        
        Returns a dict with risk_label, risk_score, scoring_method, and risk_factors.
        """
        logger.info("=== Starting risk assessment ===")
        logger.info(f"ML components available: {self.ml_available}")
        logger.info(f"Model loaded: {self.model is not None}")
        logger.info(f"Vectorizer loaded: {self.tfidf_vectorizer is not None}")
        logger.info(f"Encoder loaded: {self.categorical_encoder is not None}")
        logger.info(f"Feature names loaded: {self.feature_names is not None if self.feature_names else 'None'}")
        logger.info(f"Input data: {applicant_data}")
        logger.info(f"Scoring applicant with data: {applicant_data}")
        logger.info(f"ML available: {self.ml_available}")
        
        # If ML is not available, use rule-based only
        if not self.ml_available:
            logger.info("ML not available, using rule-based scoring")
            return self._calculate_rule_based_score(applicant_data)
        
        # Try ML model first if available
        ml_score = None
        if self.ml_available:
            logger.info("Attempting ML prediction...")
            try:
                ml_score = self._predict_with_ml_model(applicant_data)
                logger.info(f"ML prediction successful: {ml_score}")
            except Exception as e:
                logger.error(f"ML prediction failed: {str(e)}")
                logger.error("Stack trace:", exc_info=True)
        
        # Calculate rule-based score
        logger.info("Calculating rule-based score...")
        rule_label, rule_score, risk_factors = self._calculate_rule_based_score(applicant_data)
        logger.info(f"Rule-based score: {rule_score}, label: {rule_label}")
        
        # Determine final score and method
        logger.info("Determining final score...")
        if ml_score is not None:
            # Use ML score but keep risk factors from rule-based
            final_score = int(round(ml_score))
            scoring_method = 'ml'
            logger.info(f"Using ML score: {final_score}")
        else:
            # Use rule-based score
            final_score = rule_score
            scoring_method = 'rule-based'
            logger.info(f"Using rule-based score: {final_score}")
        
        # Determine risk label based on final score
        risk_label = 'High' if final_score >= HIGH_RISK_THRESHOLD else \
                    'Medium' if final_score >= MEDIUM_RISK_THRESHOLD else 'Low'
        
        logger.info(f"Final risk assessment: {{'risk_label': '{risk_label}', 'risk_score': {final_score}, 'scoring_method': '{scoring_method}', 'risk_factors': {risk_factors}}}")
        return {
            'risk_label': risk_label,
            'risk_score': final_score,
            'scoring_method': scoring_method,
            'risk_factors': risk_factors
        }

    def _predict_with_ml_model(self, applicant: Dict[str, Any]) -> Optional[float]:
        """Use the ML model to predict risk score if available"""
        if not self.ml_available:
            return None
            
        try:
            # Import required features from config
            from .config import CATEGORICAL_FEATURES, TEXT_FEATURES
            import numpy as np
            import traceback

            # Extract and process text features
            logger.info("Processing text features...")
            text_features = [str(applicant.get(field, '')) for field in TEXT_FEATURES]
            logger.info(f"Text features extracted: {len(text_features)} fields")
            text_combined = ' '.join(text_features)
            logger.info("Vectorizing text...")
            text_vectorized = self.tfidf_vectorizer.transform([text_combined])
            logger.info(f"Text vectorized shape: {text_vectorized.shape}")

            # Extract and process categorical features
            logger.info("\nProcessing categorical features...")
            categorical_features = [str(applicant.get(field, '')) for field in CATEGORICAL_FEATURES]
            logger.info(f"Categorical features extracted: {len(categorical_features)} fields")
            logger.info("Encoding categorical features...")
            categorical_encoded = self.categorical_encoder.transform([categorical_features])
            logger.info(f"Categorical encoded shape: {categorical_encoded.shape}")

            # Combine features
            logger.info("\nCombining features...")
            X = np.hstack([text_vectorized.toarray(), categorical_encoded])
            logger.info(f"Combined feature matrix shape: {X.shape}")

            # Verify feature dimensions match model expectations
            if X.shape[1] != len(self.feature_names):
                raise ValueError(
                    f"Feature dimension mismatch. Expected {len(self.feature_names)} features, "
                    f"got {X.shape[1]}. Text features: {text_vectorized.shape[1]}, "
                    f"Categorical features: {categorical_encoded.shape[1]}"
                )

            # Make prediction
            logger.info("\nMaking prediction...")
            prediction = self.model.predict(X)[0]
            logger.info(f"Raw prediction value: {prediction}")

            # Convert to float and validate range
            score = float(prediction)
            if not (0 <= score <= 100):
                raise ValueError(f"Prediction {score} outside valid range [0, 100]")

            logger.info(f"Final ML risk score: {score}")
            return score

        except Exception as e:
            logger.error(f"\nError in ML prediction: {str(e)}")
            logger.error("Traceback:")
            logger.error(traceback.format_exc())
            return None


# Initialize a global instance of the risk scorer
risk_scorer = RiskScorer()


def score_applicant(applicant_data: Dict[str, Any]) -> Dict[str, Any]:
    """Public function to score an applicant's risk.
    This is the main entry point for other modules."""
    return risk_scorer.score_applicant(applicant_data)


    def get_risk_categories(self) -> Dict[str, Dict[str, Any]]:
        """Return information about risk categories and thresholds"""
        return {
            'high': {
                'threshold': HIGH_RISK_THRESHOLD,
                'description': 'High risk clients require enhanced due diligence',
                'color': '#EF4444'  # Red color for high risk
            },
            'medium': {
                'threshold': MEDIUM_RISK_THRESHOLD,
                'description': 'Medium risk clients require standard due diligence',
                'color': '#F59E0B'  # Amber color for medium risk
            },
            'low': {
                'threshold': 0,
                'description': 'Low risk clients require simplified due diligence',
                'color': '#10B981'  # Green color for low risk
            }
        }
