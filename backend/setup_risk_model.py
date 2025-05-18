"""
Setup script for the ML risk assessment system.
This script runs the entire pipeline from data generation to model training.
"""

import os
import sys
import importlib.util

# Add the current directory to the Python path to ensure imports work correctly
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

def check_dependencies():
    """Check if required Python packages are installed"""
    required_packages = ['pandas', 'numpy', 'scikit-learn', 'joblib', 'faker']
    missing = []
    
    for package in required_packages:
        if importlib.util.find_spec(package) is None:
            missing.append(package)
    
    if missing:
        print(f"Missing required packages: {', '.join(missing)}")
        print("Please install these packages with pip:")
        print(f"pip install {' '.join(missing)}")
        return False
    return True

def setup_risk_assessment_system():
    """Run the complete setup process for the risk assessment system"""
    
    # Check dependencies
    if not check_dependencies():
        return False
    
    # Ensure the ml directory exists
    ml_dir = os.path.join(os.path.dirname(__file__), 'ml')
    os.makedirs(ml_dir, exist_ok=True)
    
    # Import modules after ensuring directory exists 
    # (these imports also verify the modules are accessible)
    try:
        from ml.data_generator import generate_dataset
        from ml.risk_model_trainer import train_risk_model
    except ImportError as e:
        print(f"Error importing ML modules: {e}")
        print("Check that the Python files exist in the 'ml' directory and have proper permissions.")
        return False
    
    # Step 1: Generate synthetic data
    print("\n" + "=" * 50)
    print("Step 1: Generating synthetic data...")
    try:
        df = generate_dataset()
        if df is None or len(df) == 0:
            print("Error: Failed to generate synthetic data")
            return False
        print("✅ Synthetic data generation complete!")
    except Exception as e:
        print(f"Error generating synthetic data: {e}")
        return False
    
    # Step 2: Train the model
    print("\n" + "=" * 50)
    print("Step 2: Training the risk assessment model...")
    try:
        success = train_risk_model()
        if not success:
            print("Error: Model training failed")
            return False
        print("✅ Model training complete!")
    except Exception as e:
        print(f"Error training model: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("Risk Assessment System Setup Complete!")
    print("=" * 50)
    
    # Print next steps
    print("\nNext Steps:")
    print("1. Restart your FastAPI backend server to load the new ML model")
    print("2. Test the risk assessment API with a sample request to /api/applications/risk-score")
    print("3. Integrate risk scoring into your frontend application")
    
    return True

if __name__ == "__main__":
    print("Finance Onboarding Application - Risk Assessment System Setup")
    print("=" * 50)
    if setup_risk_assessment_system():
        sys.exit(0)
    else:
        print("\nSetup failed. Please check the error messages above.")
        sys.exit(1)
