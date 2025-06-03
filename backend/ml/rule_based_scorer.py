"""
Rule-based risk scoring module for the finance onboarding application.
This module handles the business rule-based risk assessment independent of ML scoring.
"""

import os
import json
import logging
import random
from typing import Dict, Any, List

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
    logger.addHandler(handler)

# Define risk thresholds
HIGH_RISK_THRESHOLD = 70
MEDIUM_RISK_THRESHOLD = 40

class RuleBasedScorer:
    """Implements business rule-based risk scoring logic"""
    
    def __init__(self):
        """Initialize the rule-based scorer"""
        logger.info("Initializing rule-based risk scorer")
    
    def score_applicant(self, applicant_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply business rules to calculate a risk score
        
        Args:
            applicant_data: Dictionary containing applicant information
            
        Returns:
            Dictionary with score, level, and risk factors
        """
        try:
            # Initialize base score from a lower starting point
            risk_score = 30  # Start with a lower risk baseline
            risk_factors = []
            
            # Business rule: High-risk countries - enhanced weighting
            high_risk_countries = ['Afghanistan', 'North Korea', 'Iran', 'Iraq', 'Syria', 'Yemen', 'Somalia', 'Sudan']
            medium_risk_countries = ['Russia', 'Ukraine', 'Belarus', 'Venezuela', 'Myanmar', 'Nigeria', 'Pakistan']
            low_risk_countries = ['China', 'Turkey', 'Mexico', 'Brazil', 'India']
            
            country = applicant_data.get('country', '')
            if country in high_risk_countries:
                risk_score += 40  # Increased from 30
                risk_factors.append({
                    'name': 'High Risk Country',
                    'description': f'Business located in high-risk jurisdiction: {country}',
                    'impact': 'high'
                })
            elif country in medium_risk_countries:
                risk_score += 20  # Increased from 15
                risk_factors.append({
                    'name': 'Medium Risk Country',
                    'description': f'Business located in medium-risk jurisdiction: {country}',
                    'impact': 'medium'
                })
            elif country in low_risk_countries:
                risk_score += 10  # Added new category
                risk_factors.append({
                    'name': 'Low-Medium Risk Country',
                    'description': f'Business located in jurisdiction requiring standard monitoring: {country}',
                    'impact': 'low'
                })
            
            # Business rule: Business type risk - enhanced with more categories
            high_risk_business = ['Casino', 'Cryptocurrency', 'Cash Intensive Business', 'Money Service Business', 'Precious Metals', 'Private Banking']
            medium_risk_business = ['Online Gambling', 'Defense Contractor', 'Art Dealer', 'Real Estate', 'Construction', 'Import/Export']
            low_risk_business = ['Retail', 'Technology', 'Professional Services', 'Healthcare', 'Education']
            
            business_type = applicant_data.get('businessType', '')
            if business_type in high_risk_business:
                risk_score += 35  # Increased from 25
                risk_factors.append({
                    'name': 'High Risk Business Type',
                    'description': f'Operates in high-risk business category: {business_type}',
                    'impact': 'high'
                })
            elif business_type in medium_risk_business:
                risk_score += 15  # Increased from 10
                risk_factors.append({
                    'name': 'Medium Risk Business Type',
                    'description': f'Operates in medium-risk business category: {business_type}',
                    'impact': 'medium'
                })
            elif business_type in low_risk_business:
                risk_score += 5  # New category
                risk_factors.append({
                    'name': 'Standard Risk Business',
                    'description': f'Operates in standard-risk business category: {business_type}',
                    'impact': 'low'
                })
            elif business_type == 'Limited Company':
                risk_score += 8  # Add specific scoring for common business types
                risk_factors.append({
                    'name': 'Limited Company Structure',
                    'description': 'Limited company structure with standard risk profile',
                    'impact': 'low'
                })
            elif business_type == 'Sole Trader':
                risk_score += 5  # Lower risk for sole traders
                risk_factors.append({
                    'name': 'Sole Trader Structure',
                    'description': 'Simplified business structure with lower risk profile',
                    'impact': 'low'
                })
            
            # Add more dynamic scoring for documentation and compliance indicators
            doc_concerns = 0
            doc_impact = 'low'
            
            if applicant_data.get('isVatInvoiceRequired', '').lower() == 'no':
                doc_concerns += 1
                risk_score += 5
                
            if applicant_data.get('isStatementRequired', '').lower() == 'no':
                doc_concerns += 1
                risk_score += 5
                
            if applicant_data.get('taxInvestigationCover', '').lower() == 'no':
                doc_concerns += 1
                risk_score += 8
                
            # Adjust impact based on number of documentation concerns
            if doc_concerns >= 2:
                doc_impact = 'medium'
                risk_score += 5  # Additional points for multiple documentation issues
            
            if doc_concerns > 0:
                risk_factors.append({
                    'name': f'{doc_concerns} Documentation Concern(s)',
                    'description': f'{doc_concerns} documentation requirement(s) not satisfied',
                    'impact': doc_impact
                })
                
            # Business rule: Fee structure risk - more graduated scale
            recurring_fees = applicant_data.get('recurring_fees', 0)
            
            if recurring_fees > 100000:
                risk_score += 20
                risk_factors.append({
                    'name': 'Very Large Transaction Volume',
                    'description': 'Very large recurring fee structure significantly increases risk',
                    'impact': 'high'
                })
            elif recurring_fees > 50000:
                risk_score += 12
                risk_factors.append({
                    'name': 'Large Transaction Volume',
                    'description': 'Large recurring fee structure increases risk',
                    'impact': 'medium'
                })
            elif recurring_fees > 20000:
                risk_score += 5
                risk_factors.append({
                    'name': 'Moderate Transaction Volume',
                    'description': 'Moderate recurring fee structure requires monitoring',
                    'impact': 'low'
                })
            
            # Add verification factors for more variability
            verification_issues = 0
            
            # Identity verification
            if applicant_data.get('identity_verified', '').lower() != 'yes':
                verification_issues += 1
                risk_score += 15
                risk_factors.append({
                    'name': 'Identity Verification Issue',
                    'description': 'Client identity not fully verified',
                    'impact': 'high'
                })
                
            # Face-to-face meeting
            if applicant_data.get('met_face_to_face', '').lower() != 'yes':
                verification_issues += 1
                risk_score += 8
                risk_factors.append({
                    'name': 'No Face-to-Face',
                    'description': 'Client has not been met in person',
                    'impact': 'medium'
                })
                
            # Business verification
            if applicant_data.get('visited_business_address', '').lower() != 'yes':
                verification_issues += 1
                risk_score += 7
                risk_factors.append({
                    'name': 'Business Address Not Visited',
                    'description': 'Business premises have not been visited',
                    'impact': 'medium'
                })
                
            # Add modest random variation to create more diverse scores
            # Seed with client name or ID to ensure consistency for same client
            client_name = applicant_data.get('firstName', '') + applicant_data.get('lastName', '')
            if client_name:
                random.seed(client_name)
                # Add random variation between -5 and +5 points
                variation = random.uniform(-5, 5)
                risk_score += variation
                logger.info(f"Added random variation of {variation:.2f} points to rule-based score")
            
            # Cap the score at 100
            if risk_score > 100:
                risk_score = 100
                
            # Ensure score doesn't go below 20 (minimum threshold)
            if risk_score < 20:
                risk_score = 20
            
            # Determine risk level
            if risk_score >= HIGH_RISK_THRESHOLD:
                risk_level = 'high'
            elif risk_score >= MEDIUM_RISK_THRESHOLD:
                risk_level = 'medium'
            else:
                risk_level = 'low'
            
            return {
                'score': round(risk_score, 2),
                'level': risk_level,
                'factors': risk_factors
            }
            
        except Exception as e:
            logger.error(f"Error in rule-based scoring: {str(e)}")
            # Return a default medium risk score on error
            return {
                'score': 50.0,
                'level': 'medium',
                'factors': [{
                    'name': 'Fallback Assessment',
                    'description': 'Using default medium risk assessment due to scoring error',
                    'impact': 'medium'
                }]
            }
    
    def get_risk_categories(self) -> Dict[str, Dict[str, Any]]:
        """
        Return the risk categories and their descriptions
        
        Returns:
            Dictionary of risk categories with thresholds, descriptions, and recommended actions
        """
        categories = {
            'high': {
                'threshold': HIGH_RISK_THRESHOLD,
                'description': 'High risk clients require enhanced due diligence and frequent monitoring',
                'color': '#EF4444',  # Red color for high risk
                'actions': [
                    'Enhanced due diligence required',
                    'Senior management approval needed',
                    'Quarterly monitoring'
                ]
            },
            'medium': {
                'threshold': MEDIUM_RISK_THRESHOLD,
                'description': 'Medium risk clients require standard due diligence and regular monitoring',
                'color': '#F59E0B',  # Amber color for medium risk
                'actions': [
                    'Standard due diligence required',
                    'Regular documentation updates',
                    'Bi-annual monitoring'
                ]
            },
            'low': {
                'threshold': 0,
                'description': 'Low risk clients require simplified due diligence and standard monitoring',
                'color': '#10B981',  # Green color for low risk
                'actions': [
                    'Simplified due diligence acceptable',
                    'Basic documentation required',
                    'Standard review schedule'
                ]
            }
        }
        return categories
