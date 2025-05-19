"""
Test Risk Assessment System

This script creates test applications with different risk profiles 
and runs risk assessments on them to demonstrate the variable scoring.
"""

import requests
import json
import uuid
from pprint import pprint
import time
import random

# Configuration
API_URL = "http://localhost:8000"
VERBOSE = True  # Set to True for more detailed output

# Test profiles representing different risk levels
TEST_PROFILES = [
    {
        "name": "Very Low Risk - UK Education Limited Company",
        "data": {
            # Client Details Form
            "title": "Mrs",
            "firstName": "Emma",
            "middleName": "",
            "lastName": "Thompson",
            "salutation": "Mrs Thompson",
            "gender": "Female",
            "addressLine1": "123 High Street",
            "addressLine2": "",
            "town": "London",
            "county": "Greater London",
            "country": "United Kingdom",
            "postcode": "W1A 1AA",
            "dob": "1980-05-15",
            "dod": "2025-04-05",
            "vatNumber": "GB123456789",
            "niNumber": "AB123456C",
            "utr": "1234567890",
            "taxType": "Corporation Tax",
            "taxInvestigationCover": "yes",
            "yearEnd": "2025-12-31",
            "isVatInvoiceRequired": "yes",
            "isStatementRequired": "yes",
            "isBillingSameAddress": "yes",
            "emailCorrespondence": "emma@thompson-edu.co.uk",
            "emailFeeNote": "accounts@thompson-edu.co.uk",
            "emailVatInvoice": "finance@thompson-edu.co.uk",
            "emailStatement": "finance@thompson-edu.co.uk",
            "backupEmail": "emma.thompson@gmail.com",
            "telephone1": "02071234567",
            "telephone2": "02071234568",
            "mobile": "07700900123",
            
            # Trading As Form
            "businessType": "Limited Company",
            "contactType": "Director",
            "companyName": "Thompson Education Ltd",
            "registrationNumber": "12345678",
            
            # Referrals Form
            "introductoryCategory": "Referral",
            "sector": "Education",
            "professionalReferral": "James Wilson & Co",
            "referredBy": "James Wilson",
            
            # Risk Assessment Form (converted to answers array format)
            "answers": [
                {
                    "response": "yes",
                    "comment": "Met with client at our London office on 04/05/2025"
                },
                {
                    "response": "yes",
                    "comment": "Site visit conducted at client premises on 10/05/2025"
                },
                {
                    "response": "yes",
                    "comment": "Client is a UK resident with confirmed permanent address"
                },
                {
                    "response": "yes",
                    "comment": "Client is a UK citizen with passport verified"
                },
                {
                    "response": "yes",
                    "comment": "Client introduced by our partner James Wilson"
                },
                {
                    "response": "yes",
                    "comment": "Referred by established accounting firm with good reputation"
                },
                {
                    "response": "yes",
                    "comment": "Source of wealth verified through business accounts and company records. All documentation provided."
                }
            ]
        }
    },
    {
        "name": "Low Risk - US Technology Company",
        "data": {
            # Client Details Form
            "title": "Mr",
            "firstName": "Michael",
            "middleName": "",
            "lastName": "Roberts",
            "salutation": "Mr Roberts",
            "gender": "Male",
            "addressLine1": "555 Tech Avenue",
            "addressLine2": "Suite 200",
            "town": "San Francisco",
            "county": "California",
            "country": "United States",
            "postcode": "94107",
            "dob": "1985-08-20",
            "dod": "2025-04-05",
            "vatNumber": "",  # No VAT as US company
            "niNumber": "",  # No NI as US
            "utr": "7654321098",
            "taxType": "Corporation Tax",
            "taxInvestigationCover": "yes",
            "yearEnd": "2025-12-31",
            "isVatInvoiceRequired": "no",
            "isStatementRequired": "yes",
            "isBillingSameAddress": "yes",
            "emailCorrespondence": "michael@roberts-tech.com",
            "emailFeeNote": "finance@roberts-tech.com",
            "emailVatInvoice": "finance@roberts-tech.com",
            "emailStatement": "finance@roberts-tech.com",
            "backupEmail": "michael.roberts@gmail.com",
            "telephone1": "14155550123",
            "telephone2": "",
            "mobile": "14155550124",
            
            # Trading As Form
            "businessType": "Limited Company",
            "contactType": "Director",
            "companyName": "Roberts Technology Inc",
            "registrationNumber": "DE789456123",
            
            # Referrals Form
            "introductoryCategory": "Website",
            "sector": "Technology",
            "professionalReferral": "",
            "referredBy": "",
            
            # Risk Assessment Form
            "answers": [
                {
                    "response": "no",
                    "comment": "Initial meetings conducted via video call due to geographic distance"
                },
                {
                    "response": "no",
                    "comment": "No site visit yet due to international location"
                },
                {
                    "response": "no",
                    "comment": "Client is US resident"
                },
                {
                    "response": "no",
                    "comment": "Client is US citizen"
                },
                {
                    "response": "yes",
                    "comment": "Company has strong online presence and verified credentials"
                },
                {
                    "response": "yes",
                    "comment": "Found via our website but credentials verified through industry connections"
                },
                {
                    "response": "yes",
                    "comment": "Financial records and public company filings reviewed and verified"
                }
            ]
        }
    },
    {
        "name": "Medium Risk - Turkey Construction Sole Trader",
        "data": {
            # Client Details Form
            "title": "Mr",
            "firstName": "Ahmet",
            "middleName": "",
            "lastName": "Yilmaz",
            "salutation": "Mr Yilmaz",
            "gender": "Male",
            "addressLine1": "14 Istiklal Street",
            "addressLine2": "",
            "town": "Istanbul",
            "county": "",
            "country": "Turkey",
            "postcode": "34000",
            "dob": "1975-03-10",
            "dod": "2025-04-05",
            "vatNumber": "",
            "niNumber": "",
            "utr": "",
            "taxType": "",
            "taxInvestigationCover": "no",
            "yearEnd": "2025-12-31",
            "isVatInvoiceRequired": "no",
            "isStatementRequired": "yes",
            "isBillingSameAddress": "yes",
            "emailCorrespondence": "ahmet@yilmaz-construction.tr",
            "emailFeeNote": "ahmet@yilmaz-construction.tr",
            "emailVatInvoice": "ahmet@yilmaz-construction.tr",
            "emailStatement": "ahmet@yilmaz-construction.tr",
            "backupEmail": "ahmet.yilmaz@gmail.com",
            "telephone1": "902121234567",
            "telephone2": "",
            "mobile": "905301234567",
            
            # Trading As Form
            "businessType": "Sole Trader",
            "contactType": "Owner",
            "companyName": "Yilmaz Construction",
            "registrationNumber": "",
            
            # Referrals Form
            "introductoryCategory": "Direct",
            "sector": "Construction",
            "professionalReferral": "",
            "referredBy": "",
            
            # Risk Assessment Form
            "answers": [
                {
                    "response": "yes",
                    "comment": "Met during international business conference"
                },
                {
                    "response": "no",
                    "comment": "No site visit conducted yet"
                },
                {
                    "response": "no",
                    "comment": "Client is resident in Turkey"
                },
                {
                    "response": "no",
                    "comment": "Client is Turkish national"
                },
                {
                    "response": "no",
                    "comment": "No prior relationship or knowledge of client"
                },
                {
                    "response": "no",
                    "comment": "Client approached us directly without referral"
                },
                {
                    "response": "yes",
                    "comment": "Bank statements and business records provided, appear consistent with stated business activities"
                }
            ]
        }
    },
    {
        "name": "High Risk - Russia Real Estate",
        "data": {
            # Client Details Form
            "title": "Mr",
            "firstName": "Dmitri",
            "middleName": "",
            "lastName": "Petrov",
            "salutation": "Mr Petrov",
            "gender": "Male",
            "addressLine1": "45 Nevsky Prospect",
            "addressLine2": "Floor 3",
            "town": "Saint Petersburg",
            "county": "",
            "country": "Russia",
            "postcode": "191186",
            "dob": "1970-12-15",
            "dod": "2025-04-05",
            "vatNumber": "",
            "niNumber": "",
            "utr": "",
            "taxType": "",
            "taxInvestigationCover": "no",
            "yearEnd": "2025-12-31",
            "isVatInvoiceRequired": "no",
            "isStatementRequired": "yes",
            "isBillingSameAddress": "no",
            "billingAddressLine1": "1 Cyprus Avenue",
            "billingAddressLine2": "",
            "billingTown": "Limassol",
            "billingCounty": "",
            "billingCountry": "Cyprus",
            "billingPostcode": "3042",
            "emailCorrespondence": "d.petrov@petrovinvest.ru",
            "emailFeeNote": "finance@petrovinvest.ru",
            "emailVatInvoice": "finance@petrovinvest.ru",
            "emailStatement": "finance@petrovinvest.ru",
            "backupEmail": "dmitri.petrov@mail.ru",
            "telephone1": "78121234567",
            "telephone2": "",
            "mobile": "79211234567",
            
            # Trading As Form
            "businessType": "Limited Company",
            "contactType": "Director",
            "companyName": "Petrov Investments LLC",
            "registrationNumber": "1234567890",
            
            # Referrals Form
            "introductoryCategory": "Direct",
            "sector": "Real Estate",
            "professionalReferral": "",
            "referredBy": "",
            
            # Risk Assessment Form
            "answers": [
                {
                    "response": "no",
                    "comment": "Client unwilling to meet in person, only communicates through representative"
                },
                {
                    "response": "no",
                    "comment": "No site visit conducted"
                },
                {
                    "response": "no",
                    "comment": "Client is resident in Russia"
                },
                {
                    "response": "no",
                    "comment": "Client is Russian national"
                },
                {
                    "response": "no",
                    "comment": "No prior knowledge of client"
                },
                {
                    "response": "no",
                    "comment": "Client approached directly without reputable referral source"
                },
                {
                    "response": "no",
                    "comment": "Documentation regarding source of wealth incomplete and unclear"
                }
            ]
        }
    },
    {
        "name": "Very High Risk - Nigeria Cryptocurrency",
        "data": {
            # Client Details Form
            "title": "Mr",
            "firstName": "Oluwaseun",
            "middleName": "",
            "lastName": "Adebayo",
            "salutation": "Mr Adebayo",
            "gender": "Male",
            "addressLine1": "7 Victoria Island",
            "addressLine2": "",
            "town": "Lagos",
            "county": "",
            "country": "Nigeria",
            "postcode": "101001",
            "dob": "1988-09-25",
            "dod": "2025-04-05",
            "vatNumber": "",
            "niNumber": "",
            "utr": "",
            "taxType": "",
            "taxInvestigationCover": "no",
            "yearEnd": "2025-12-31",
            "isVatInvoiceRequired": "no",
            "isStatementRequired": "yes",
            "isBillingSameAddress": "yes",
            "emailCorrespondence": "seun@cryptonaira.ng",
            "emailFeeNote": "seun@cryptonaira.ng",
            "emailVatInvoice": "seun@cryptonaira.ng",
            "emailStatement": "seun@cryptonaira.ng",
            "backupEmail": "oluwaseun.adebayo@gmail.com",
            "telephone1": "2341234567",
            "telephone2": "",
            "mobile": "2348012345678",
            
            # Trading As Form
            "businessType": "Sole Trader",
            "contactType": "Owner",
            "companyName": "CryptoNaira",
            "registrationNumber": "",
            
            # Referrals Form
            "introductoryCategory": "Website",
            "sector": "Cryptocurrency",
            "professionalReferral": "",
            "referredBy": "",
            
            # Risk Assessment Form
            "answers": [
                {
                    "response": "no",
                    "comment": "Client refuses in-person meeting"
                },
                {
                    "response": "no",
                    "comment": "Unable to verify business premises"
                },
                {
                    "response": "no",
                    "comment": "Client is not UK resident"
                },
                {
                    "response": "no",
                    "comment": "Client is not UK national"
                },
                {
                    "response": "no",
                    "comment": "No prior knowledge or relationship"
                },
                {
                    "response": "no",
                    "comment": "No referral source"
                },
                {
                    "response": "no",
                    "comment": "Unclear explanation of wealth sources, documentation pending"
                }
            ]
        }
    },
    {
        "name": "Mixed Risk - UK Gambling Company with Issues",
        "data": {
            # Client Details Form
            "title": "Ms",
            "firstName": "Charlotte",
            "middleName": "",
            "lastName": "Wilson",
            "salutation": "Ms Wilson",
            "gender": "Female",
            "addressLine1": "88 Casino Street",
            "addressLine2": "",
            "town": "Manchester",
            "county": "Greater Manchester",
            "country": "United Kingdom",
            "postcode": "M2 1AB",
            "dob": "1982-11-30",
            "dod": "2025-04-05",
            "vatNumber": "GB987654321",
            "niNumber": "XY987654A",
            "utr": "5678912340",
            "taxType": "Corporation Tax",
            "taxInvestigationCover": "yes",
            "yearEnd": "2025-12-31",
            "isVatInvoiceRequired": "yes",
            "isStatementRequired": "yes",
            "isBillingSameAddress": "yes",
            "emailCorrespondence": "charlotte@wilsongaming.co.uk",
            "emailFeeNote": "accounts@wilsongaming.co.uk",
            "emailVatInvoice": "finance@wilsongaming.co.uk",
            "emailStatement": "finance@wilsongaming.co.uk",
            "backupEmail": "charlotte.wilson@gmail.com",
            "telephone1": "01612345678",
            "telephone2": "",
            "mobile": "07700900777",
            
            # Trading As Form
            "businessType": "Limited Company",
            "contactType": "Director",
            "companyName": "Wilson Gaming Ltd",
            "registrationNumber": "87654321",
            
            # Referrals Form
            "introductoryCategory": "Referral",
            "sector": "Gambling",
            "professionalReferral": "Smith & Co Accountants",
            "referredBy": "John Smith",
            
            # Risk Assessment Form
            "answers": [
                {
                    "response": "yes",
                    "comment": "Met with client but documentation still pending verification"
                },
                {
                    "response": "yes",
                    "comment": "Visited but some concerns about actual business activity at premises"
                },
                {
                    "response": "yes",
                    "comment": "UK resident"
                },
                {
                    "response": "yes",
                    "comment": "UK national"
                },
                {
                    "response": "yes",
                    "comment": "Previously known but some adverse media found in research"
                },
                {
                    "response": "yes",
                    "comment": "Referred by existing client but some questions about relationship"
                },
                {
                    "response": "no",
                    "comment": "Source of initial investment capital unclear and documentation incomplete"
                }
            ]
        }
    }
]

def create_application():
    """Create a new application"""
    try:
        response = requests.post(f"{API_URL}/api/applications", json={})
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error creating application: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"Exception creating application: {e}")
        return None

def save_form_progress(app_id, step, data):
    """Save form data for an application"""
    try:
        payload = {
            "application_id": app_id,
            "step": step,
            "data": data
        }
        response = requests.post(f"{API_URL}/api/form-progress", json=payload)
        if response.status_code == 200:
            print(f"Saving {step} form...")
            return response.json()
        else:
            print(f"Error saving {step} form: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"Exception saving {step} form: {e}")
        return None

def assess_risk(app_id, combined_data):
    """Get risk assessment for an application"""
    try:
        from backend.ml.risk_scorer import score_applicant
        return score_applicant(combined_data)
    except Exception as e:
        print(f"Exception assessing risk: {e}")
        return None

def submit_test_profile(name, data):
    """Submit a test profile and get its risk assessment"""
    print(f"\n[Test {test_counter}/{len(TEST_PROFILES)}] Testing profile: {name}")
    
    # Get risk assessment directly
    result = assess_risk(None, data)
    if not result:
        print("Failed to get risk assessment, skipping profile")
        print("\n" + "=" * 100)
        return None
    
    print("Risk assessment complete:")
    print(f"  Risk Label: {result['risk_label']}")
    print(f"  Risk Score: {result['risk_score']}/100")
    print(f"  Scoring Method: {result['scoring_method']}")
    print(f"  Risk Factors: {len(result['risk_factors'])}")
    
    if len(result['risk_factors']) > 0:
        print("\nRisk Factors:")
        for factor in result['risk_factors']:
            print(f"  - {factor['description']} (Severity: {factor['severity']})")
    
    return result


def run_test():
    """Run test with all profiles"""
    results = []
    
    print("\n" + "="*80)
    print("FINANCE ONBOARDING APP - RISK ASSESSMENT TEST")
    print("="*80 + "\n")
    
    global test_counter
    test_counter = 1
    
    for profile in TEST_PROFILES:
        result = submit_test_profile(profile["name"], profile["data"])
        if result:
            results.append({
                "profile_name": profile["name"],
                "risk_result": result
            })
        test_counter += 1
    
    print("\n" + "="*100)
    print("RISK ASSESSMENT COMPARISON")
    print("="*100)
    
    results.sort(key=lambda x: x['risk_result']['risk_score'])
    
    print(f"{'Profile':<40} | {'Risk Label':<10} | {'Risk Score':<10} | {'Factors':<8} | {'Method':<15}")
    print("-"*100)
    for result in results:
        print(f"{result['profile_name']:<40} | "
              f"{result['risk_result']['risk_label']:<10} | "
              f"{result['risk_result']['risk_score']:<10} | "
              f"{len(result['risk_result'].get('risk_factors', [])):<8} | "
              f"{result['risk_result']['scoring_method']:<15}")
    
    print("\nTest completed successfully!")
    return results

if __name__ == "__main__":
    run_test()
