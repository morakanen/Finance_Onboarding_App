"""
ML model trainer for risk assessment.
Trains a model on synthetic data and saves it for use in prediction.
"""

import pandas as pd
import numpy as np
import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from .config import (
    SYNTHETIC_DATA_PATH, 
    MODEL_PATH, 
    VECTORIZER_PATH, 
    ENCODER_PATH,
    FEATURE_NAMES_PATH,
    TEXT_FEATURES,
    CATEGORICAL_FEATURES,
)

def train_risk_model():
    """Train and save the risk assessment model"""
    
    print("Starting risk model training...")
    
    # Check if the synthetic data exists
    if not os.path.exists(SYNTHETIC_DATA_PATH):
        print(f"Error: Synthetic data file not found at {SYNTHETIC_DATA_PATH}")
        print("Please run data_generator.py first to create the synthetic data.")
        return False
        
    # Load the synthetic data
    print(f"Loading synthetic data from {SYNTHETIC_DATA_PATH}")
    df = pd.read_csv(SYNTHETIC_DATA_PATH)
    print(f"Loaded {len(df)} records")
    
    # Combine all text features for NLP analysis
    print("Preparing text features...")
    df['all_comments'] = df[TEXT_FEATURES].apply(lambda row: ' '.join(row.astype(str)), axis=1)
    
    # Prepare feature columns and target
    X = df[CATEGORICAL_FEATURES + ['all_comments']]
    y = df['risk_label']
    
    # Split into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"Training set: {X_train.shape[0]} samples, Test set: {X_test.shape[0]} samples")
    
    # Create preprocessing pipelines
    print("Creating model pipeline...")
    text_transformer = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=100, stop_words='english', ngram_range=(1, 2)))
    ])
    
    categorical_transformer = Pipeline([
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])
    
    # Column transformer to process different feature types
    preprocessor = ColumnTransformer(
        transformers=[
            ('text', text_transformer, 'all_comments'),
            ('cat', categorical_transformer, CATEGORICAL_FEATURES)
        ])
    
    # Create and train the model
    model = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    
    print("Training model...")
    model.fit(X_train, y_train)
    
    # Evaluate model
    print("Evaluating model...")
    y_pred = model.predict(X_test)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Save the model components
    print(f"Saving model to {MODEL_PATH}")
    joblib.dump(model, MODEL_PATH)
    
    # Also save individual components for more flexible usage
    tfidf_vectorizer = model.named_steps['preprocessor'].transformers_[0][1].named_steps['tfidf']
    print(f"Saving TF-IDF vectorizer to {VECTORIZER_PATH}")
    joblib.dump(tfidf_vectorizer, VECTORIZER_PATH)
    
    encoder = model.named_steps['preprocessor'].transformers_[1][1].named_steps['onehot']
    print(f"Saving categorical encoder to {ENCODER_PATH}")
    joblib.dump(encoder, ENCODER_PATH)
    
    # Save feature names to ensure consistent order during prediction
    # This is important for ensuring the model receives features in the same order as during training
    feature_names = {
        'categorical': CATEGORICAL_FEATURES,
        'text': TEXT_FEATURES
    }
    print(f"Saving feature names to {FEATURE_NAMES_PATH}")
    joblib.dump(feature_names, FEATURE_NAMES_PATH)
    
    print("Model training and saving complete!")
    return True

if __name__ == "__main__":
    train_risk_model()
