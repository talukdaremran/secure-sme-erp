# Secure SME ERP AI Service

This service provides AI analytics for the Secure SME ERP project.

## Planned Features

- Sales forecasting
- Inventory demand prediction
- Suspicious activity / anomaly detection
- Customer churn prediction

## Run locally

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Health check
```http
GET http://localhost:8000/health
```

---