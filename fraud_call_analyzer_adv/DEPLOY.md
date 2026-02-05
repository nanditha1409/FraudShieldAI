# Deployment Guide for FraudShield AI Backend

## Render Deployment

### 1. Prerequisites
- Render account
- GitHub repository with this code

### 2. Deployment Steps

1. **Connect Repository**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `fraud_call_analyzer_adv` folder as root directory

2. **Configuration**
   - **Name**: `ai-fraud-detection-api-714m`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free tier is sufficient for testing

3. **Environment Variables** (Optional)
   - `VALID_API_KEY`: `fraud_detection_api_key_2026`

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your API will be available at: `https://ai-fraud-detection-api-714m.onrender.com`

### 3. Verification

Test the deployment:
```bash
# Health check
curl https://ai-fraud-detection-api-714m.onrender.com/

# API documentation
curl https://ai-fraud-detection-api-714m.onrender.com/docs
```

### 4. Important Notes

- **Cold Start**: First request may take 30-60 seconds due to Render's free tier cold start
- **API Keys**: Backend accepts both `fraud_detection_api_key_2026` and `HACKATHON_DEMO_2026`
- **CORS**: Configured to allow all origins for hackathon use
- **Endpoints**: 
  - `GET /` - Health check
  - `GET /health` - Health check
  - `POST /analyze-call` - Main analysis endpoint
  - `GET /docs` - Swagger documentation

### 5. Troubleshooting

- Check Render logs if deployment fails
- Ensure all dependencies are in requirements.txt
- Verify the start command matches your app structure