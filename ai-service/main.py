from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import List, Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.linear_model import LinearRegression


app = FastAPI(
    title="Secure SME ERP AI Service",
    description="AI analytics service for forecasting, anomaly detection, and prediction.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SalesHistoryItem(BaseModel):
    sale_date: str
    total_sales: float
    order_count: int


class SalesForecastRequest(BaseModel):
    sales_history: List[SalesHistoryItem]
    forecast_days: int = 7

class AuditLogItem(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    action: str
    module: Optional[str] = None
    result: Optional[str] = None
    created_at: str


class AuditAnomalyRequest(BaseModel):
    audit_logs: List[AuditLogItem]

def get_actor_label(log: AuditLogItem):
    if log.user_email:
        return log.user_email

    if log.user_name:
        return log.user_name

    if log.user_id:
        return f"user-{log.user_id}"

    return "unknown-user"

@app.get("/health")
def health_check():
    return {
        "status": "success",
        "service": "ai-service",
        "message": "AI service is running",
        "features": {
            "sales_forecasting": "available",
            "anomaly_detection": "available",
            "customer_churn_prediction": "planned",
        },
    }


@app.post("/forecast/sales")
def forecast_sales(request: SalesForecastRequest):
    sales_history = sorted(
        request.sales_history,
        key=lambda item: item.sale_date,
    )

    forecast_days = max(1, min(request.forecast_days, 30))

    if len(sales_history) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 days of sales history are required for forecasting.",
        )

    first_date = datetime.strptime(sales_history[0].sale_date, "%Y-%m-%d").date()

    x_values = []
    y_values = []

    for item in sales_history:
        current_date = datetime.strptime(item.sale_date, "%Y-%m-%d").date()
        day_number = (current_date - first_date).days

        x_values.append([day_number])
        y_values.append(item.total_sales)

    x_train = np.array(x_values)
    y_train = np.array(y_values)

    model = LinearRegression()
    model.fit(x_train, y_train)

    last_date = datetime.strptime(sales_history[-1].sale_date, "%Y-%m-%d").date()
    last_day_number = (last_date - first_date).days

    forecast = []

    for day_offset in range(1, forecast_days + 1):
        future_day_number = last_day_number + day_offset
        future_date = last_date + timedelta(days=day_offset)

        predicted_sales = model.predict(np.array([[future_day_number]]))[0]
        predicted_sales = max(0, round(float(predicted_sales), 2))

        forecast.append(
            {
                "date": future_date.isoformat(),
                "predicted_sales": predicted_sales,
            }
        )

    return {
        "status": "success",
        "model": "LinearRegression",
        "forecast_days": forecast_days,
        "history_points": len(sales_history),
        "training_data": [
            {
                "date": item.sale_date,
                "total_sales": item.total_sales,
                "order_count": item.order_count,
            }
            for item in sales_history
        ],
        "forecast": forecast,
    }

@app.post("/detect/audit-anomalies")
def detect_audit_anomalies(request: AuditAnomalyRequest):
    audit_logs = request.audit_logs
    anomalies = []

    if not audit_logs:
        return {
            "status": "success",
            "model": "RuleBasedAuditPatternDetection",
            "logs_analysed": 0,
            "anomalies": [],
            "summary": {
                "high": 0,
                "medium": 0,
                "low": 0,
            },
        }

    failed_login_counter = Counter()
    failed_action_counter = Counter()
    total_activity_counter = Counter()
    risky_action_counter = Counter()
    after_hours_counter = Counter()

    risky_actions = {
        "DELETE_USER",
        "DELETE_PRODUCT",
        "DELETE_CUSTOMER",
        "DELETE_SALES_ORDER",
        "DELETE_PURCHASE_ORDER",
        "UPDATE_USER",
        "UPDATE_PURCHASE_ORDER_STATUS",
        "APPROVE_INVENTORY_ADJUSTMENT",
        "REJECT_INVENTORY_ADJUSTMENT",
    }

    for log in audit_logs:
        actor = get_actor_label(log)
        action = (log.action or "").upper()
        result = (log.result or "").lower()

        total_activity_counter[actor] += 1

        if "LOGIN" in action and result == "failed":
            failed_login_counter[actor] += 1

        if result == "failed":
            failed_action_counter[actor] += 1

        if action in risky_actions or action.startswith("DELETE"):
            risky_action_counter[actor] += 1

        try:
            created_at = datetime.fromisoformat(
                log.created_at.replace("Z", "+00:00")
            )

            if created_at.hour < 6 or created_at.hour >= 22:
                after_hours_counter[actor] += 1
        except ValueError:
            pass

    for actor, count in failed_login_counter.items():
        if count >= 3:
            anomalies.append(
                {
                    "severity": "high",
                    "type": "repeated_failed_logins",
                    "title": "Repeated failed login attempts",
                    "description": f"{actor} has {count} failed login attempts in recent audit logs.",
                    "evidence": {
                        "actor": actor,
                        "failed_login_count": count,
                    },
                    "recommendation": "Review account access, check whether the user forgot their password, and monitor for possible brute-force attempts.",
                }
            )

    for actor, count in failed_action_counter.items():
        if count >= 5:
            anomalies.append(
                {
                    "severity": "high",
                    "type": "high_failed_action_count",
                    "title": "High number of failed actions",
                    "description": f"{actor} has {count} failed actions in recent audit logs.",
                    "evidence": {
                        "actor": actor,
                        "failed_action_count": count,
                    },
                    "recommendation": "Review the failed actions and confirm whether this is user error, permission misuse, or suspicious activity.",
                }
            )

    for actor, count in total_activity_counter.items():
        if count >= 20:
            anomalies.append(
                {
                    "severity": "medium",
                    "type": "high_user_activity",
                    "title": "Unusually high user activity",
                    "description": f"{actor} performed {count} logged actions recently.",
                    "evidence": {
                        "actor": actor,
                        "activity_count": count,
                    },
                    "recommendation": "Check whether the activity is expected for this user's role and working pattern.",
                }
            )

    for actor, count in risky_action_counter.items():
        if count >= 3:
            anomalies.append(
                {
                    "severity": "medium",
                    "type": "multiple_risky_actions",
                    "title": "Multiple risky actions detected",
                    "description": f"{actor} performed {count} risky update/delete actions recently.",
                    "evidence": {
                        "actor": actor,
                        "risky_action_count": count,
                    },
                    "recommendation": "Review affected records and confirm these changes were authorised.",
                }
            )

    for actor, count in after_hours_counter.items():
        if count >= 5:
            anomalies.append(
                {
                    "severity": "low",
                    "type": "after_hours_activity",
                    "title": "After-hours activity detected",
                    "description": f"{actor} performed {count} actions outside normal business hours.",
                    "evidence": {
                        "actor": actor,
                        "after_hours_action_count": count,
                    },
                    "recommendation": "Confirm whether the user was expected to work outside normal hours.",
                }
            )

    severity_counter = Counter(item["severity"] for item in anomalies)

    return {
        "status": "success",
        "model": "RuleBasedAuditPatternDetection",
        "logs_analysed": len(audit_logs),
        "anomalies": anomalies,
        "summary": {
            "high": severity_counter.get("high", 0),
            "medium": severity_counter.get("medium", 0),
            "low": severity_counter.get("low", 0),
        },
    }