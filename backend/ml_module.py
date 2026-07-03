import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_validate
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, roc_curve, precision_recall_curve

# Models
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier

import shap
import lime
import lime.lime_tabular
import pickle
import os

MODELS_DIR = r"e:\PERSONAL\custmoer churn\backend\saved_models"
os.makedirs(MODELS_DIR, exist_ok=True)

def get_model_instances():
    return {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Random Forest": RandomForestClassifier(random_state=42),
        "Decision Tree": DecisionTreeClassifier(random_state=42),
        "XGBoost": XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42),
        "LightGBM": LGBMClassifier(random_state=42, verbose=-1),
        "CatBoost": CatBoostClassifier(random_seed=42, verbose=0),
        "Gradient Boosting": GradientBoostingClassifier(random_state=42),
        "Support Vector Machine": SVC(probability=True, random_state=42),
        "K-Nearest Neighbors": KNeighborsClassifier(),
        "Neural Networks": MLPClassifier(max_iter=500, random_state=42)
    }

def train_and_evaluate(df: pd.DataFrame, target_col: str, model_name: str, test_size=0.2):
    # Separate features and target
    X = df.drop(columns=[target_col])
    y = df[target_col].astype(int)

    # Automatically identify categorical & numeric columns
    numeric_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_features = X.select_dtypes(include=['object', 'category']).columns.tolist()

    # Create preprocessor
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)

    # Build full pipeline
    models = get_model_instances()
    if model_name not in models:
        raise ValueError(f"Model {model_name} is not supported.")
    
    clf = Pipeline(steps=[('preprocessor', preprocessor),
                          ('classifier', models[model_name])])
    
    # Train
    clf.fit(X_train, y_train)

    # Evaluate
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1] if hasattr(clf, "predict_proba") else y_pred.astype(float)

    # Metrics
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1": float(f1_score(y_test, y_pred, zero_division=0)),
        "auc": float(roc_auc_score(y_test, y_prob))
    }

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred).tolist()
    metrics["confusion_matrix"] = cm

    # Save model
    model_path = os.path.join(MODELS_DIR, f"{model_name.replace(' ', '_').lower()}.pkl")
    with open(model_path, "wb") as f:
        pickle.dump({
            "pipeline": clf,
            "numeric_features": numeric_features,
            "categorical_features": categorical_features,
            "features": X.columns.tolist()
        }, f)

    # ROC & Precision-Recall curves
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    precision_pts, recall_pts, _ = precision_recall_curve(y_test, y_prob)

    curves = {
        "roc": {"fpr": fpr.tolist(), "tpr": tpr.tolist()},
        "pr": {"precision": precision_pts.tolist(), "recall": recall_pts.tolist()}
    }

    # Feature Importance (heuristic approach based on model type)
    feature_importance = {}
    try:
        transformer = clf.named_steps['preprocessor']
        # Retrieve transformed feature names
        num_cols = numeric_features
        cat_cols = []
        if categorical_features:
            cat_encoder = transformer.named_transformers_['cat'].named_steps['onehot']
            cat_cols = cat_encoder.get_feature_names_out(categorical_features).tolist()
        all_features = num_cols + cat_cols

        raw_model = clf.named_steps['classifier']
        importances = None
        if hasattr(raw_model, "feature_importances_"):
            importances = raw_model.feature_importances_
        elif hasattr(raw_model, "coef_"):
            importances = np.abs(raw_model.coef_[0])

        if importances is not None:
            for feat, val in zip(all_features, importances):
                feature_importance[feat] = float(val)
    except Exception:
        pass

    return metrics, curves, feature_importance

def explain_lime(model_name: str, df: pd.DataFrame, target_col: str, instance_index: int = 0):
    """Calculates LIME local explanation for the specified instance."""
    model_path = os.path.join(MODELS_DIR, f"{model_name.replace(' ', '_').lower()}.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError("Model needs to be trained first.")
    
    with open(model_path, "rb") as f:
        model_data = pickle.load(f)

    pipeline = model_data["pipeline"]
    features = model_data["features"]

    X = df.drop(columns=[target_col])
    instance = X.iloc[[instance_index]]

    # For LIME, explain the prediction using LimeTabularExplainer on pipeline prediction
    # We pass raw features and predict_proba of full pipeline
    def predict_fn(x_df):
        # x_df is numpy array, convert to pandas
        temp_df = pd.DataFrame(x_df, columns=features)
        return pipeline.predict_proba(temp_df)

    # Build LIME explainer
    # To keep it simple and robust, fit explainer on training data representation
    # Categorical variables treated as numeric/encoded inside the pipeline
    explainer = lime.lime_tabular.LimeTabularExplainer(
        training_data=np.array(X.select_dtypes(include=[np.number]).fillna(0)),
        feature_names=X.select_dtypes(include=[np.number]).columns.tolist(),
        class_names=["No Churn", "Churn"],
        mode="classification"
    )

    # Local explanation
    inst_numeric = instance.select_dtypes(include=[np.number]).fillna(0).iloc[0].values
    exp = explainer.explain_instance(
        data_row=inst_numeric,
        predict_fn=lambda x: pipeline.predict_proba(pd.concat([instance.copy()]*len(x)).assign(**{col: x[:, idx] for idx, col in enumerate(X.select_dtypes(include=[np.number]).columns)}))
    )

    return exp.as_list()
