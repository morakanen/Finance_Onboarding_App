"""
Synthetic data generator for ML risk assessment system.
Generates realistic mock data that mimics the structure of real onboarding forms.
"""

import pandas as pd
import numpy as np
import json
from faker import Faker
import random
from datetime import datetime, timedelta
import os
from .config import (
    SYNTHETIC_DATA_PATH, 
    SAMPLE_JSON_PATH,
    NUM_SYNTHETIC_RECORDS,
    HIGH_RISK_COUNTRIES,
    MEDIUM_RISK_COUNTRIES,
    HIGH_RISK_SECTORS,
    MEDIUM_RISK_SECTORS
)

# Initialize Faker with UK locale
fake = Faker('en_GB')

# Enumerated options from the forms
TITLES = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof']
GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say']
COUNTRIES = ['United Kingdom', 'United States', 'France', 'Germany'] + HIGH_RISK_COUNTRIES + MEDIUM_RISK_COUNTRIES
BUSINESS_TYPES = ['Sole Trader', 'Limited Company', 'Partnership', 'LLP', 'Charity']
SECTORS = ['Retail', 'Technology', 'Healthcare', 'Construction', 'Hospitality', 'Education'] + HIGH_RISK_SECTORS + MEDIUM_RISK_SECTORS
CONTACT_TYPES = ['Director', 'Partner', 'Owner', 'Trustee', 'Manager']
INTRO_CATEGORIES = ['Direct', 'Referral', 'Website', 'Social Media', 'Other']
YES_NO = ['yes', 'no']
TAX_TYPES = ['Self Assessment', 'Corporation Tax', 'VAT', 'PAYE']

# Risk assessment questions from the form
RISK_QUESTIONS = [
    "Have we met the client face to face?",
    "Have we visited the client at their usual residential or business address?",
    "Is the client resident in UK?",
    "Is client a UK national?",
    "Was client previously known to a partner or manager, or is it a well-known local business?",
    "Has client been referred by reputable source?",
    "Do we have reasonable belief that the client's levels of wealth have a plausible explanation?"
]

def generate_uk_company_number():
    """Generate a fake UK company registration number"""
    return f"{random.randint(10000000, 99999999)}"

def generate_utr():
    """Generate a fake Unique Taxpayer Reference"""
    return f"{random.randint(1000000000, 9999999999)}"

def generate_vat_number():
    """Generate a fake UK VAT number"""
    return f"GB {random.randint(100000000, 999999999)}"

def generate_ni_number():
    """Generate a fake UK National Insurance number"""
    return f"{random.choice('ABCEGHJKLMNOPRSTWXYZ')}{random.choice('ABCEGHJKLMNPRSTWXYZ')} {random.randint(10, 99)} {random.randint(10, 99)} {random.randint(10, 99)} {random.choice('ABCD')}"

def generate_risk_assessment(country, sector):
    """Generate risk assessment answers and comments with bias based on country/sector risk"""
    answers = {}
    
    # Bias the responses based on country and sector risk
    country_risk = 0.3  # Default probability of 'no'
    if country in HIGH_RISK_COUNTRIES:
        country_risk = 0.7
    elif country in MEDIUM_RISK_COUNTRIES:
        country_risk = 0.5
        
    sector_risk = 0.3  # Default probability of 'no'
    if sector in HIGH_RISK_SECTORS:
        sector_risk = 0.7
    elif sector in MEDIUM_RISK_SECTORS:
        sector_risk = 0.5
    
    avg_risk = (country_risk + sector_risk) / 2
    
    for i in range(1, 8):
        # Questions about UK residency/nationality have special handling
        if i == 3:  # "Is the client resident in UK?"
            if country == 'United Kingdom':
                response = random.choices(['yes', 'no'], weights=[0.95, 0.05])[0]
            else:
                response = random.choices(['yes', 'no'], weights=[0.2, 0.8])[0]
        elif i == 4:  # "Is client a UK national?"
            if country == 'United Kingdom':
                response = random.choices(['yes', 'no'], weights=[0.9, 0.1])[0]
            else:
                response = random.choices(['yes', 'no'], weights=[0.3, 0.7])[0]
        else:
            # Other questions use the average risk
            response = random.choices(['yes', 'no'], weights=[1-avg_risk, avg_risk])[0]
        
        # Generate appropriate comments based on the answer
        if response == 'yes':
            comments = [
                f"Confirmed during meeting on {fake.date_this_year().strftime('%d/%m/%Y')}",
                "Verified through identification documentation",
                "Confirmed via video call and documentation",
                "Evidence provided and verified",
                "Verified through certified documentation",
                "Confirmed through compliance checks"
            ]
        else:
            comments = [
                "Not yet verified - awaiting documentation",
                "Client prefers remote communication only",
                "Documentation pending review",
                "Requires further investigation",
                "Client declined to provide detailed information",
                "Information inconsistent - flagged for review"
            ]
        
        answers[f'risk_q{i}_response'] = response
        answers[f'risk_q{i}_comment'] = random.choice(comments)
    
    return answers

def calculate_synthetic_risk(applicant):
    """Calculate risk label for synthetic data"""
    score = 50  # Start at neutral
    
    # Country risk (0-25 points)
    if applicant['country'] in HIGH_RISK_COUNTRIES:
        score += 25
    elif applicant['country'] in MEDIUM_RISK_COUNTRIES:
        score += 15
    elif applicant['country'] not in ['United Kingdom', 'United States', 'France', 'Germany']:
        score += 5
        
    # Business type risk (0-10 points)
    if applicant['businessType'] == 'Sole Trader':
        score += 10
    elif applicant['businessType'] == 'Partnership':
        score += 8
    elif applicant['businessType'] == 'LLP':
        score += 5
    elif applicant['businessType'] == 'Limited Company':
        score += 3
        
    # Sector risk (0-20 points)
    if applicant['sector'] in HIGH_RISK_SECTORS:
        score += 20
    elif applicant['sector'] in MEDIUM_RISK_SECTORS:
        score += 10
        
    # Risk question responses (0-35 points)
    for i in range(1, 8):
        if applicant[f'risk_q{i}_response'] == 'no':
            score += 5  # 5 points per 'no' answer
            
    # Normalize to 0-100
    score = max(0, min(100, score))
    
    # Assign category
    if score >= 70:
        return 'High', score
    elif score >= 40:
        return 'Medium', score
    else:
        return 'Low', score

def generate_synthetic_record():
    """Generate a single synthetic applicant record"""
    gender = random.choice(GENDERS)
    country = random.choices(
        COUNTRIES, 
        weights=[0.45, 0.1, 0.05, 0.05] + [0.035] * len(HIGH_RISK_COUNTRIES) + [0.02] * len(MEDIUM_RISK_COUNTRIES)
    )[0]
    
    sector = random.choices(
        SECTORS,
        weights=[0.1] * 6 + [0.05] * len(HIGH_RISK_SECTORS) + [0.075] * len(MEDIUM_RISK_SECTORS)
    )[0]
    
    # Business info
    business_type = random.choice(BUSINESS_TYPES)
    has_company = business_type in ['Limited Company', 'LLP', 'Partnership']
    
    # Generate record matching the form fields from the actual application
    record = {
        # Client Details Form
        'title': random.choice(TITLES),
        'firstName': fake.first_name_male() if gender == 'Male' else fake.first_name_female(),
        'middleName': fake.first_name() if random.random() > 0.7 else '',
        'lastName': fake.last_name(),
        'salutation': '',
        'gender': gender,
        
        # Address
        'addressLine1': fake.street_address(),
        'addressLine2': fake.secondary_address() if random.random() > 0.5 else '',
        'town': fake.city(),
        'county': fake.county() if country == 'United Kingdom' else '',
        'country': country,
        'postcode': fake.postcode() if country == 'United Kingdom' else fake.postcode(),
        
        # Dates & Tax Info
        'dob': fake.date_of_birth(minimum_age=18, maximum_age=80).strftime('%Y-%m-%d'),
        'dod': fake.date_this_decade().strftime('%Y-%m-%d'),
        'vatNumber': generate_vat_number() if random.random() > 0.3 else '',
        'niNumber': generate_ni_number() if random.random() > 0.2 else '',
        'utr': generate_utr(),
        'taxType': random.choice(TAX_TYPES),
        'taxInvestigationCover': random.choice(YES_NO),
        'yearEnd': f"{random.randint(1,28)}/{random.randint(1,12)}",
        'isVatInvoiceRequired': random.choice(YES_NO),
        'isStatementRequired': random.choice(YES_NO),
        
        # Billing details
        'isBillingSameAddress': random.choices(['yes', 'no'], weights=[0.7, 0.3])[0],
        'billingAddressLine1': '',
        'billingAddressLine2': '',
        'billingTown': '',
        'billingCounty': '',
        'billingCountry': '',
        'billingPostcode': '',
        
        # Contact details
        'emailCorrespondence': fake.email(),
        'emailFeeNote': fake.email(),
        'emailVatInvoice': fake.email(),
        'emailStatement': fake.email(),
        'backupEmail': fake.email(),
        'telephone1': fake.phone_number(),
        'telephone2': fake.phone_number() if random.random() < 0.3 else '',
        'mobile': fake.phone_number(),
        
        # Trading As Form
        'contactType': random.choice(CONTACT_TYPES),
        'businessType': business_type,
        'companyName': fake.company() if has_company else '',
        'registrationNumber': generate_uk_company_number() if has_company else '',
        
        # Referrals Form
        'introductoryCategory': random.choice(INTRO_CATEGORIES),
        'sector': sector,
        'professionalReferral': fake.name() if random.choice(INTRO_CATEGORIES) == 'Referral' else '',
        'referredBy': fake.name() if random.choice(INTRO_CATEGORIES) == 'Referral' else '',
    }
    
    # Add risk assessment answers (with bias based on country/sector)
    risk_answers = generate_risk_assessment(country, sector)
    record.update(risk_answers)
    
    # Populate billing address if different from main address
    if record['isBillingSameAddress'] == 'no':
        record['billingAddressLine1'] = fake.street_address()
        record['billingAddressLine2'] = fake.secondary_address() if random.random() > 0.5 else ''
        record['billingTown'] = fake.city()
        record['billingCounty'] = fake.county() if country == 'United Kingdom' else ''
        record['billingCountry'] = record['country']  # Usually same country
        record['billingPostcode'] = fake.postcode() if country == 'United Kingdom' else fake.postcode()
    
    # Calculate risk label and score
    risk_label, risk_score = calculate_synthetic_risk(record)
    record['risk_label'] = risk_label
    record['risk_score'] = risk_score
    
    return record

def generate_dataset():
    """Generate complete synthetic dataset"""
    print(f"Generating {NUM_SYNTHETIC_RECORDS} synthetic applicant records...")
    
    records = [generate_synthetic_record() for _ in range(NUM_SYNTHETIC_RECORDS)]
    df = pd.DataFrame(records)
    
    # Save to CSV
    df.to_csv(SYNTHETIC_DATA_PATH, index=False)
    print(f"Saved {len(df)} records to {SYNTHETIC_DATA_PATH}")
    
    # Save sample record for API testing
    with open(SAMPLE_JSON_PATH, 'w') as f:
        json.dump(records[0], f, indent=2)
    print(f"Saved sample applicant JSON to {SAMPLE_JSON_PATH}")
    
    return df

if __name__ == "__main__":
    generate_dataset()
