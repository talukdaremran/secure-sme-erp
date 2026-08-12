from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


@app.get("/health")
def health_check():
    return {
        "status": "success",
        "service": "ai-service",
        "message": "AI service is running",
        "features": {
            "sales_forecasting": "planned",
            "anomaly_detection": "planned",
            "customer_churn_prediction": "planned",
        },
    }