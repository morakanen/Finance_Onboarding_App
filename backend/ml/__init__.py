"""
ML module for risk assessment in finance onboarding application.
This module provides tools to generate synthetic data, train a risk assessment model,
and score applicants based on their onboarding form data.

Module components:
- rule_based_scorer: Business rule-based risk scoring
- ml_scorer: Machine learning based risk scoring
- risk_assessment_service: Combined risk assessment using both methods
"""

# Do not import risk_scorer here to avoid circular dependencies
# The individual modules will be imported where needed
