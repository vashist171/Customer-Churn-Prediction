import os
import pandas as pd
import numpy as np

DATA_DIR = r"e:\PERSONAL\custmoer churn\Bank+Customer+Churn"

def list_datasets():
    """Lists CSV and Excel datasets available in the Bank+Customer+Churn folder."""
    files = []
    if not os.path.exists(DATA_DIR):
        return files
    for f in os.listdir(DATA_DIR):
        if f.endswith(".csv") or f.endswith(".xlsx") or f.endswith(".xls"):
            files.append(f)
    return files

def load_dataset(filename: str):
    """Loads a specific dataset from the directory."""
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {filename}")
    if filename.endswith(".csv"):
        df = pd.read_csv(path)
    else:
        df = pd.read_excel(path)
    return df

def clean_and_profile_dataset(df: pd.DataFrame):
    """Profiles the dataset, detects data types, handles missing values, and removes duplicates."""
    # Deduplicate
    initial_rows = len(df)
    df = df.drop_duplicates()
    deduplicated_rows = initial_rows - len(df)
    
    columns_info = []
    
    # Analyze columns and impute missing values
    for col in df.columns:
        col_type = str(df[col].dtype)
        missing_count = int(df[col].isnull().sum())
        
        # Simple imputation
        if missing_count > 0:
            if df[col].dtype in [np.float64, np.int64]:
                df[col] = df[col].fillna(df[col].median())
            else:
                df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else "Unknown")
        
        unique_count = int(df[col].nunique())
        
        # Categorize
        if df[col].dtype in [np.float64, np.int64]:
            detected_type = "numeric"
        else:
            detected_type = "categorical"
            
        columns_info.append({
            "name": col,
            "original_type": col_type,
            "detected_type": detected_type,
            "missing_values": missing_count,
            "unique_values": unique_count
        })
        
    return df, columns_info
