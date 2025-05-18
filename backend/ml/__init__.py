"""
ML module for risk assessment in finance onboarding application.
This module provides tools to generate synthetic data, train a risk assessment model,
and score applicants based on their onboarding form data.
"""

# Make the main functions available at the module level
from .risk_scorer import score_applicant, get_risk_categories
