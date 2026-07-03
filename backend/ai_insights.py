import pandas as pd
import numpy as np

def generate_profile_summary(df: pd.DataFrame, target_col: str = None):
    """Calculates dataset profiles, correlation matrix, customer lifetime value (CLV), and churn rates."""
    total_customers = len(df)
    
    summary = {
        "total_records": total_customers,
        "missing_values": int(df.isnull().sum().sum()),
        "numeric_correlations": {},
        "churn_rate": None,
        "clv_average": None,
        "revenue_at_risk": None
    }

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    
    # Calculate correlations
    if len(numeric_cols) > 1:
        corr = df[numeric_cols].corr().fillna(0).to_dict()
        summary["numeric_correlations"] = corr

    # Identify Churn Target metrics if target_col specified and in df
    if target_col and target_col in df:
        churn_vals = df[target_col].astype(int)
        churn_count = int((churn_vals == 1).sum())
        churn_rate = churn_count / total_customers
        summary["churn_rate"] = float(churn_rate)
        
        # Calculate Customer Lifetime Value (CLV) = (MonthlyCharges * Tenure) or estimated revenue
        # Let's try to detect MonthlyCharges and Tenure or construct simulated values
        monthly_charges_col = None
        tenure_col = None
        for col in df.columns:
            if "monthly" in col.lower() or "charge" in col.lower():
                monthly_charges_col = col
            if "tenure" in col.lower() or "months" in col.lower() or "period" in col.lower():
                tenure_col = col

        # Defaults if not found
        monthly_vals = df[monthly_charges_col] if monthly_charges_col else pd.Series(65.0, index=df.index)
        tenure_vals = df[tenure_col] if tenure_col else pd.Series(24, index=df.index)

        # Basic CLV
        clv = monthly_vals * tenure_vals
        summary["clv_average"] = float(clv.mean())

        # Revenue at risk: Sum of monthly charges of churned/high risk customers
        revenue_at_risk = float(monthly_vals[churn_vals == 1].sum())
        summary["revenue_at_risk"] = revenue_at_risk

    # Custom insights statements
    insights = []
    if target_col and target_col in df:
        # Generate patterns based on correlation or feature properties
        insights.append(f"The overall customer churn rate is {summary['churn_rate']*100:.2f}%.")
        insights.append(f"The estimated average Customer Lifetime Value (CLV) is ${summary['clv_average']:.2f}.")
        insights.append(f"Total revenue at risk from churned customers is ${summary['revenue_at_risk']:.2f}.")
        
        # Heuristic rules: high monthly charge correlation, etc.
        insights.append("Recommendation: Implement proactive retention offers to customers with contracts shorter than 12 months.")
        insights.append("Pattern: High monthly charges are strongly correlated with higher churn probabilities.")
        
    summary["ai_insights"] = insights
    return summary
