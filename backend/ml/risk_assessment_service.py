"""
Combined risk assessment service that integrates rule-based and ML-based scoring.
"""

import logging
from typing import Dict, Any, List, Optional

from ml.rule_based_scorer import RuleBasedScorer
from ml.ml_scorer import get_ml_scorer

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
    logger.addHandler(handler)

class RiskAssessmentService:
    """
    Service that combines rule-based and ML-based risk scoring
    and provides a unified interface for risk assessment.
    """
    
    def __init__(self):
        """Initialize the risk assessment service with both scoring methods"""
        self.rule_based_scorer = RuleBasedScorer()
        self.ml_scorer = get_ml_scorer()
        logger.info("Risk assessment service initialized with both scoring methods")
    
    def assess_risk(self, applicant_data: Dict[str, Any], rule_weight: float = 0.5) -> Dict[str, Any]:
        """
        Perform a comprehensive risk assessment using both rule-based and ML methods
        
        Args:
            applicant_data: Dictionary containing applicant information
            rule_weight: Weight for rule-based score (0.0-1.0), ML weight will be (1 - rule_weight)
            
        Returns:
            Dictionary with rule-based, ML-based, and weighted average risk assessments
        """
        # Get rule-based risk assessment
        rule_based_result = self.rule_based_scorer.score_applicant(applicant_data)
        
        # Get ML-based risk assessment
        ml_result = self.ml_scorer.score_applicant(applicant_data)
        
        # Calculate weighted average score
        weighted_result = self._calculate_weighted_score(rule_based_result, ml_result, rule_weight)
        
        # Generate comments about any discrepancies
        comments = self._generate_comparison_comments(rule_based_result, ml_result)
        
        # Return the combined assessment
        return {
            'rule_based': rule_based_result,
            'ml_based': ml_result,
            'weighted': weighted_result,
            'comments': comments
        }
    
    def _generate_comparison_comments(self, 
                                     rule_based: Dict[str, Any], 
                                     ml_based: Dict[str, Any]) -> List[str]:
        """
        Generate comments comparing rule-based and ML-based assessments
        
        Args:
            rule_based: Rule-based risk assessment results
            ml_based: ML-based risk assessment results
            
        Returns:
            List of comments about discrepancies or notable observations
        """
        comments = []
        
        # Check for score discrepancy
        rule_score = rule_based.get('score', 0)
        ml_score = ml_based.get('score', 0)
        
        if abs(rule_score - ml_score) > 20:
            comments.append(
                f"Large discrepancy between rule-based and ML scores (difference: "
                f"{abs(rule_score - ml_score):.1f} points). "
                f"Manual review recommended."
            )
        
        # Check for risk level discrepancy
        rule_level = rule_based.get('level', '')
        ml_level = ml_based.get('level', '')
        
        if rule_level != ml_level:
            comments.append(
                f"Risk levels differ between rule-based ({rule_level}) and "
                f"ML-based ({ml_level}) assessments. Consider manual review."
            )
        
        # If both methods agree on high risk, emphasize it
        if rule_level == 'high' and ml_level == 'high':
            comments.append(
                "Both rule-based and ML assessments indicate high risk. "
                "Enhanced due diligence strongly recommended."
            )
        
        return comments
    
    def _calculate_weighted_score(self, rule_based: Dict[str, Any], ml_based: Dict[str, Any], rule_weight: float = 0.5) -> Dict[str, Any]:
        """
        Calculate a weighted average score based on rule-based and ML-based assessments
        
        Args:
            rule_based: Rule-based risk assessment results
            ml_based: ML-based risk assessment results
            rule_weight: Weight for rule-based score (0.0-1.0), ML weight will be (1 - rule_weight)
            
        Returns:
            Dictionary with weighted score, level, and combined risk factors
        """
        # Validate weight is between 0 and 1
        rule_weight = max(0.0, min(1.0, rule_weight))
        ml_weight = 1.0 - rule_weight
        
        # Extract scores
        rule_score = rule_based.get('score', 50)
        ml_score = ml_based.get('score', 50)
        
        # Calculate weighted score
        weighted_score = (rule_score * rule_weight) + (ml_score * ml_weight)
        weighted_score = round(weighted_score, 2)
        
        # Determine risk level based on weighted score
        if weighted_score >= 70:
            weighted_level = 'high'
        elif weighted_score >= 40:
            weighted_level = 'medium'
        else:
            weighted_level = 'low'
        
        # Combine risk factors from both sources
        weighted_factors = []
        
        # Add rule-based factors first with source identification
        for factor in rule_based.get('factors', []):
            factor_copy = factor.copy()
            if 'name' in factor_copy and not factor_copy['name'].startswith('Rule:'): 
                factor_copy['name'] = f"Rule: {factor_copy['name']}"
            weighted_factors.append(factor_copy)
        
        # Add ML-based factors with source identification
        for factor in ml_based.get('factors', []):
            factor_copy = factor.copy()
            if 'name' in factor_copy and not factor_copy['name'].startswith('ML:') and not factor_copy['name'].startswith('ML Factor:'): 
                factor_copy['name'] = f"ML: {factor_copy['name']}"
            weighted_factors.append(factor_copy)
            
        # Add a factor explaining the weighted calculation
        weighted_factors.append({
            'name': 'Combined Assessment',
            'description': f'Weighted score calculated with {rule_weight*100:.0f}% rule-based and {ml_weight*100:.0f}% ML-based assessment',
            'impact': 'medium'
        })
        
        return {
            'score': weighted_score,
            'level': weighted_level,
            'factors': weighted_factors
        }
    
    def get_risk_categories(self) -> Dict[str, Dict[str, Any]]:
        """
        Return the risk categories and their descriptions
        
        Returns:
            Dictionary of risk categories with thresholds, descriptions, and recommended actions
        """
        # Both scorers have the same risk categories, so we can use either one
        return self.rule_based_scorer.get_risk_categories()

# Create a singleton instance of the service
risk_assessment_service = RiskAssessmentService()
