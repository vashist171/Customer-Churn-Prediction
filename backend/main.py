from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
import json

from backend.data_processor import list_datasets, load_dataset, clean_and_profile_dataset
from backend.ml_module import train_and_evaluate, explain_lime
from backend.ai_insights import generate_profile_summary
from backend.database import get_db

app = FastAPI(title="Customer Churn Prediction & BI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory datasets cache to speed up access without database ingestion
datasets_cache = {}

class TrainRequest(BaseModel):
    filename: str
    target_col: str
    model_name: str
    test_size: Optional[float] = 0.2

class DashboardConfig(BaseModel):
    id: Optional[str] = None
    name: str
    widgets: List[Dict[str, Any]]
    theme: str

@app.get("/api/datasets")
def get_datasets():
    return list_datasets()

@app.get("/api/datasets/{filename}/preview")
def preview_dataset(filename: str):
    try:
        df = load_dataset(filename)
        cleaned_df, profile = clean_and_profile_dataset(df)
        datasets_cache[filename] = cleaned_df
        
        # Convert first 100 rows to list of dicts for preview
        records = cleaned_df.head(100).replace({float('nan'): None}).to_dict(orient="records")
        return {
            "columns": profile,
            "preview_data": records,
            "total_rows": len(cleaned_df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/datasets/{filename}/profile")
def profile_dataset(filename: str, target_col: Optional[str] = None):
    try:
        if filename in datasets_cache:
            df = datasets_cache[filename]
        else:
            df = load_dataset(filename)
            df, _ = clean_and_profile_dataset(df)
            datasets_cache[filename] = df
            
        summary = generate_profile_summary(df, target_col)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/models/train")
def train_model(req: TrainRequest):
    try:
        if req.filename in datasets_cache:
            df = datasets_cache[req.filename]
        else:
            df = load_dataset(req.filename)
            df, _ = clean_and_profile_dataset(df)
            datasets_cache[req.filename] = df

        metrics, curves, importances = train_and_evaluate(df, req.target_col, req.model_name, req.test_size)
        return {
            "metrics": metrics,
            "curves": curves,
            "feature_importance": importances
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models/explain-lime")
def lime_explanation(filename: str, model_name: str, target_col: str, index: int = 0):
    try:
        if filename in datasets_cache:
            df = datasets_cache[filename]
        else:
            df = load_dataset(filename)
            df, _ = clean_and_profile_dataset(df)
            datasets_cache[filename] = df

        explanation = explain_lime(model_name, df, target_col, index)
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Dashboard persistence endpoints
@app.get("/api/dashboards")
def list_dashboards():
    db = get_db()
    dashboards = list(db.dashboards.find({}, {"_id": 0}))
    return dashboards

@app.post("/api/dashboards")
def save_dashboard(config: DashboardConfig):
    db = get_db()
    # Upsert using dashboard name as identifier
    db.dashboards.update_one(
        {"name": config.name},
        {"$set": config.dict()},
        upsert=True
    )
    return {"status": "success", "message": f"Dashboard {config.name} saved."}
