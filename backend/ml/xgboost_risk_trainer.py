"""
XGBoost-based risk assessment model trainer.
Trains a regression model to predict risk scores based on application data.
"""

import pandas as pd
import numpy as np
import os
import json
import xgboost as xgb
from sklearn.preprocessing import StandardScaler, OneHotEncoder, RobustScaler
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, explained_variance_score
from sklearn.pipeline import Pipeline
import joblib
from config import (
    SYNTHETIC_DATA_PATH,
    XGBOOST_MODEL_PATH,
    SCALER_PATH,
    FEATURE_NAMES_PATH,
    CATEGORICAL_FEATURES,
    BINARY_FEATURES,
    NUMERIC_FEATURES,
    HIGH_RISK_THRESHOLD,
    MEDIUM_RISK_THRESHOLD
)

def train_risk_model():
    """Train and save the XGBoost risk assessment model"""
    
    print("Starting XGBoost risk model training...")
    
    # Check if synthetic data exists
    if not os.path.exists(SYNTHETIC_DATA_PATH):
        print(f"Error: Synthetic data file not found at {SYNTHETIC_DATA_PATH}")
        print("Please run data_generator.py first to create the synthetic data.")
        return False
        
    # Load the synthetic data
    print(f"Loading synthetic data from {SYNTHETIC_DATA_PATH}")
    df = pd.read_csv(SYNTHETIC_DATA_PATH)
    print(f"Loaded {len(df)} records")
    
    # Prepare features
    print("Preparing features...")
    
    # Convert binary features to numeric (0/1)
    for col in BINARY_FEATURES:
        df[col] = (df[col] == 'yes').astype(int)
    
    # Add feature interactions
    print("Adding feature interactions...")
    # Interaction between recurring and non-recurring fees
    df['total_fees'] = df['recurring_fees'] + df['non_recurring_fees']
    # Interaction between risk factors
    df['identity_risk'] = (
        df['identity_verified'].astype(float) +
        df['evidence_recorded'].astype(float) +
        df['beneficial_owners_verified'].astype(float)
    ) / 3
    
    # Add these new features to NUMERIC_FEATURES
    additional_features = ['total_fees', 'identity_risk']
    all_numeric_features = NUMERIC_FEATURES + additional_features
    
    # Initialize preprocessor for different feature types
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', RobustScaler(), all_numeric_features),  # RobustScaler handles outliers better
            ('cat', OneHotEncoder(drop='first', sparse_output=False), CATEGORICAL_FEATURES)
        ]
    )
    
    # Prepare feature matrix X and target y
    X = df[all_numeric_features + CATEGORICAL_FEATURES + BINARY_FEATURES]
    
    # Normalize target variable to [0, 1] range
    y = df['risk_score'] / 100
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"Training set: {X_train.shape[0]} samples, Test set: {X_test.shape[0]} samples")
    
    # Fit preprocessor and transform data
    print("Preprocessing features...")
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)
    
    # Get feature names after preprocessing
    feature_names = (
        NUMERIC_FEATURES +
        [f"{col}_{val}" for col, cats in zip(
            CATEGORICAL_FEATURES,
            preprocessor.named_transformers_['cat'].categories_
        ) for val in cats[1:]] +
        BINARY_FEATURES
    )
    
    # Save feature names for later use
    with open(FEATURE_NAMES_PATH, 'w') as f:
        json.dump(feature_names, f)
    
    # Initialize XGBoost model with hyperparameter grid
    print("Training XGBoost model with hyperparameter tuning...")
    model = xgb.XGBRegressor(random_state=42)
    
    param_grid = {
        'n_estimators': [200, 300],
        'max_depth': [5, 7],
        'learning_rate': [0.03, 0.05],
        'min_child_weight': [3],
        'subsample': [0.85, 0.9],
        'colsample_bytree': [0.85, 0.9],
        'gamma': [0.1],
        'reg_alpha': [0.1, 0.5],
        'reg_lambda': [0.1, 0.5]
    }
    
    grid_search = GridSearchCV(
        estimator=model,
        param_grid=param_grid,
        cv=5,
        scoring='neg_mean_squared_error',
        n_jobs=-1,
        verbose=2
    )
    
    grid_search.fit(X_train_processed, y_train)
    
    # Get best model
    model = grid_search.best_estimator_
    
    # Evaluate model
    print("\nBest Model Parameters:")
    print(grid_search.best_params_)
    print(f"Best CV Score: {-grid_search.best_score_:.2f} MSE")
    
    print("\nEvaluating model on test set...")
    y_pred = model.predict(X_test_processed)
    
    # Calculate multiple metrics
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    ev = explained_variance_score(y_test, y_pred)
    
    print(f"Test RMSE: {rmse:.2f}")
    print(f"Test MAE: {mae:.2f}")
    print(f"Test R²: {r2:.2f}")
    print(f"Test Explained Variance: {ev:.2f}")
    
    # Calculate prediction distribution
    print("\nPrediction Distribution:")
    pred_df = pd.DataFrame({'Actual': y_test, 'Predicted': y_pred})
    print(pred_df.describe())
    
    # Print feature importance
    print("\nFeature Importance:")
    importances = model.feature_importances_
    n_features = min(len(feature_names), len(importances))
    feature_importance = pd.DataFrame({
        'feature': feature_names[:n_features],
        'importance': importances[:n_features]
    }).sort_values('importance', ascending=False)
    
    print("\nTop 10 Most Important Features:")
    print(feature_importance.head(10))
    
    # Save model and preprocessor
    print(f"\nSaving model to {XGBOOST_MODEL_PATH}")
    model.save_model(XGBOOST_MODEL_PATH)
    
    print(f"Saving preprocessor to {SCALER_PATH}")
    joblib.dump(preprocessor, SCALER_PATH)
    
    print("\nModel training complete!")
    return True

if __name__ == "__main__":
    train_risk_model()
