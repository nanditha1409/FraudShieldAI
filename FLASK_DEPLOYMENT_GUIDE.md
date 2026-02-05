# Flask Backend Deployment Guide

## 🚨 Current Issue
The Render backend is returning 404 for all endpoints. The backend needs to be redeployed with the correct Flask configuration.

## ✅ Flask Backend Ready

I've created a Flask version of the backend at `fraud_call_analyzer_adv/flask_app.py` with the following endpoints:

### Available Routes:
- `GET /` - Health check
- `GET /health` - Health check  
- `POST /analyze` - Main fraud analysis endpoint
- `POST /detect` - Alternative endpoint (same as /analyze)
- `POST /predict` - Alternative endpoint (same as /analyze)

### API Key Validation:
- Header: `x-api-key`
- Valid keys: `fraud_detection_api_key_2026`, `HACKATHON_DEMO_2026`

## 🚀 Render Deployment Steps

### Option 1: Update Existing Service

1. **Update Start Command in Render**:
   - Go to Render Dashboard
   - Find service: `ai-fraud-detection-api-714m`
   - Go to Settings
   - Update Start Command to: `python flask_app.py`
   - Or use: `gunicorn flask_app:app --host 0.0.0.0 --port $PORT`

2. **Verify Environment**:
   - Environment: Python 3
   - Root Directory: `fraud_call_analyzer_adv`
   - Build Command: `pip install -r requirements.txt`

3. **Deploy**:
   - Click "Manual Deploy"
   - Wait for deployment

### Option 2: Create New Service (If needed)

1. **Create New Web Service**:
   - Name: `fraudshield-flask-api`
   - Environment: Python 3
   - Root Directory: `fraud_call_analyzer_adv`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python flask_app.py`

## 🧪 Testing After Deployment

### 1. Health Check
```bash
curl https://ai-fraud-detection-api-714m.onrender.com/
# Expected: {"status": "ok", "message": "FraudShield AI Flask API is running"}
```

### 2. Analyze Endpoint
```bash
curl -X POST "https://ai-fraud-detection-api-714m.onrender.com/analyze" \
  -H "Content-Type: application/json" \
  -H "x-api-key: fraud_detection_api_key_2026" \
  -d '{"textInput": "I need your social security number urgently"}'
```

### 3. Test with Frontend
```bash
cd FraudShieldAI
node test-connection.js
```

## 📱 Frontend Changes Applied

The Expo app has been updated to:
- ✅ Call `/analyze` endpoint (correct Flask route)
- ✅ Use 60-second timeout for Render cold starts
- ✅ Enhanced error handling for Flask responses
- ✅ Proper input validation
- ✅ Debug logging for troubleshooting

## 🔍 Expected Flow After Fix

1. **User Action**: Types text and presses "Stop & Analyze"
2. **Frontend**: Calls `https://ai-fraud-detection-api-714m.onrender.com/analyze`
3. **Flask Backend**: Validates API key and processes request
4. **Response**: Returns fraud analysis JSON
5. **Frontend**: Displays risk score and results

## 🚨 Current Status

- ✅ Flask backend code ready
- ✅ Frontend updated to call correct endpoints
- ✅ Enhanced error handling and debugging
- ❌ Render service needs redeployment with Flask configuration

## 📋 Verification Checklist

After redeployment:
- [ ] Health endpoint returns 200 OK
- [ ] `/analyze` endpoint accepts POST requests
- [ ] API key validation works (403 for invalid keys)
- [ ] Text analysis returns fraud detection results
- [ ] Expo app connects successfully
- [ ] No more 404 errors

## 🎯 Quick Test Commands

```bash
# Test health
curl https://ai-fraud-detection-api-714m.onrender.com/

# Test analyze with valid key
curl -X POST "https://ai-fraud-detection-api-714m.onrender.com/analyze" \
  -H "Content-Type: application/json" \
  -H "x-api-key: fraud_detection_api_key_2026" \
  -d '{"textInput": "test message"}'

# Test API key validation (should return 403)
curl -X POST "https://ai-fraud-detection-api-714m.onrender.com/analyze" \
  -H "Content-Type: application/json" \
  -H "x-api-key: invalid_key" \
  -d '{"textInput": "test"}'
```

The Flask backend is ready to deploy and the frontend is configured correctly. Once redeployed, the 404 errors should be resolved!