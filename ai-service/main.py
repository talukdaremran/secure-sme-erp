from datetime import datetime, timedelta
from typing import List

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


@app.get("/health")
def health_check():
    return {
        "status": "success",
        "service": "ai-service",
        "message": "AI service is running",
        "features": {
            "sales_forecasting": "available",
            "anomaly_detection": "planned",
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