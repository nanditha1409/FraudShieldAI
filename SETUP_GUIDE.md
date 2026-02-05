# FraudShield AI - Complete Setup Guide

This guide will help you set up both the FastAPI backend on Render and the Expo React Native frontend.

## 📋 Table of Contents
1. [Backend Setup (Render)](#backend-setup)
2. [Frontend Setup (Expo)](#frontend-setup)
3. [Testing](#testing)
4. [Troubleshooting](#troubleshooting)

---

## 🔧 Backend Setup (Render)

### Step 1: Prepare Backend Code

The backend is located in `fraud_call_analyzer_adv/` directory.

**Key Files:**
- `app.py` - Main FastAPI application
- `requirements.txt` - Python dependencies
- `fraud_engine/` - Fraud detection logic

**Configuration:**
- ✅ API Key: `fraud_detection_api_key_2026` (already configured)
- ✅ Multiple keys supported: `["fraud_detection_api_key_2026", "HACKATHON_DEMO_2026"]`
- ✅ CORS enabled for all origins
- ✅ Health endpoints: `/` and `/health`

### Step 2: Deploy to Render

1. **Create Render Account**
   - Go to https://render.com
   - Sign up or log in

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Or use "Deploy from Git URL"

3. **Configure Service**
   ```
   Name: ai-fraud-detection-api-714m
   Environment: Python 3
   Root Directory: fraud_call_analyzer_adv
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn app:app --host 0.0.0.0 --port $PORT
   Instance Type: Free
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for initial deployment
   - Note your service URL: `https://ai-fraud-detection-api-714m.onrender.com`

### Step 3: Verify Backend

Test the deployment:

```bash
# Health check
curl https://ai-fraud-detection-api-714m.onrender.com/

# Expected response:
# {"status":"ok","message":"Fraud Call Analyzer API is running"}

# View API documentation
open https://ai-fraud-detection-api-714m.onrender.com/docs
```

**Important Notes:**
- ⏱️ First request may take 30-60 seconds (cold start on free tier)
- 🔄 Service spins down after 15 minutes of inactivity
- 📝 Check Render logs if issues occur

---

## 📱 Frontend Setup (Expo)

### Step 1: Install Dependencies

```bash
cd FraudShieldAI
npm install
```

**Dependencies installed:**
- `expo` - Expo SDK
- `expo-file-system` - File handling (for audio base64 conversion)
- `expo-document-picker` - File selection
- `expo-linear-gradient` - UI styling
- `react-native` - Mobile framework

### Step 2: Verify Configuration

The app is pre-configured with correct settings in `App.js`:

```javascript
export const API_CONFIG = {
  BASE_URL: 'https://ai-fraud-detection-api-714m.onrender.com',
  API_KEY: 'fraud_detection_api_key_2026',
  TIMEOUT: 60000, // 60 seconds for cold starts
  ENDPOINTS: {
    HEALTH: '/',
    ANALYZE_TEXT: '/analyze-call',
    ANALYZE_AUDIO: '/analyze-call',
  },
};
```

**Environment Variables** (`.env` file):
```env
EXPO_PUBLIC_API_KEY=fraud_detection_api_key_2026
```

### Step 3: Start Development Server

```bash
npm start
```

This will:
- Start Expo development server
- Show QR code in terminal
- Open Expo DevTools in browser

### Step 4: Run on Device

**Option A: Expo Go (Recommended for Testing)**
1. Install Expo Go app on your phone:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. Scan QR code from terminal with:
   - iOS: Camera app
   - Android: Expo Go app

**Option B: Simulator/Emulator**
- Press `i` for iOS Simulator (Mac only)
- Press `a` for Android Emulator (requires Android Studio)

**Option C: Web Browser**
- Press `w` to open in web browser
- Note: Speech recognition only works on web

---

## 🧪 Testing

### Test 1: API Connection

Run the test script:
```bash
cd FraudShieldAI
node test-api.js
```

Expected output:
```
🚀 Starting API tests for FraudShield AI...

🔍 Testing health endpoint...
✅ Health check passed: { status: 'ok', message: '...' }

🔍 Testing text analysis...
✅ Text analysis passed: { status: 'success', ... }

🎉 All tests passed! The API is ready for Expo Go.
```

### Test 2: Text Analysis in App

1. Open app in Expo Go
2. Scroll to "Live Transcript" section
3. Type: `"I need your social security number and bank account details urgently"`
4. Tap "Stop & Analyze"
5. Expected: HIGH risk score with red indicator

### Test 3: Audio File Upload

1. Tap "Choose Audio File"
2. Select any audio file (mp3, wav, m4a)
3. Tap "Analyze Audio"
4. Wait for processing (may take 30-60 seconds on first request)
5. Expected: Analysis results with transcript and risk score

### Test 4: Cold Start Handling

1. Wait 15+ minutes (Render service sleeps)
2. Make a request
3. Expected: 60-second timeout should handle cold start
4. Request should succeed after initial delay

---

## 🔍 Troubleshooting

### Backend Issues

**Problem: "Endpoint not found" error**
- Solution: Redeploy backend on Render
- Check: Root directory is set to `fraud_call_analyzer_adv`
- Verify: Start command is `uvicorn app:app --host 0.0.0.0 --port $PORT`

**Problem: "Invalid API Key" (403 error)**
- Check: API key in frontend matches backend
- Backend accepts: `fraud_detection_api_key_2026` or `HACKATHON_DEMO_2026`
- Verify: Header is `x-api-key` (not `Authorization`)

**Problem: Timeout errors**
- Cause: Render cold start on free tier
- Solution: Already configured with 60-second timeout
- Wait: First request may take 30-60 seconds

**Problem: 500 Internal Server Error**
- Check: Render logs for Python errors
- Verify: All dependencies in requirements.txt
- Test: Audio format is supported (wav, mp3, m4a)

### Frontend Issues

**Problem: "Network Error" or "Unable to reach backend"**
- Check: Internet connection
- Verify: Backend URL is correct
- Test: `curl https://ai-fraud-detection-api-714m.onrender.com/`
- Wait: Cold start may be in progress

**Problem: Audio upload fails**
- Ensure: File is audio format
- Check: File size under 10MB
- Verify: expo-file-system is installed
- Test: Try different audio file

**Problem: App crashes on startup**
- Clear cache: `expo start -c`
- Reinstall: `rm -rf node_modules && npm install`
- Check: Node.js version 18+

**Problem: "Live speech recognition not available"**
- Expected: Speech recognition only works on web
- Workaround: Use text input or audio file upload
- Note: This is an Expo Go limitation

### Common Fixes

**Clear Expo cache:**
```bash
expo start -c
```

**Reinstall dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Check backend status:**
```bash
curl -v https://ai-fraud-detection-api-714m.onrender.com/
```

**View Render logs:**
- Go to Render Dashboard
- Select your service
- Click "Logs" tab

---

## 📊 Expected Behavior

### Successful Text Analysis Response
```json
{
  "status": "success",
  "language": "en",
  "audio_format": "wav",
  "classification": "HIGH",
  "confidence": 0.85,
  "matched_keywords": ["social security", "bank account", "urgently"],
  "reason": "Multiple fraud indicators detected",
  "transcript": "I need your social security number...",
  "acoustics": {}
}
```

### Successful Audio Analysis Response
```json
{
  "status": "success",
  "language": "en",
  "audio_format": "mp3",
  "classification": "MEDIUM",
  "confidence": 0.65,
  "matched_keywords": ["verify", "account"],
  "reason": "Suspicious patterns detected",
  "transcript": "Transcribed text from audio...",
  "acoustics": {
    "avg_db": -20.5,
    "silence_ratio": 0.15
  }
}
```

---

## 🎯 Quick Reference

### API Endpoints
- `GET /` - Health check
- `GET /health` - Health check
- `POST /analyze-call` - Main analysis endpoint
- `GET /docs` - Swagger documentation

### Request Headers
```javascript
{
  "Content-Type": "application/json",
  "x-api-key": "fraud_detection_api_key_2026"
}
```

### Request Body (Text Analysis)
```json
{
  "language": "en",
  "audioFormat": "wav",
  "textInput": "Your transcript here"
}
```

### Request Body (Audio Analysis)
```json
{
  "language": "en",
  "audioFormat": "mp3",
  "audioBase64": "base64_encoded_audio_data"
}
```

---

## 🚀 Next Steps

1. ✅ Deploy backend to Render
2. ✅ Verify backend health endpoint
3. ✅ Test API with curl or test script
4. ✅ Start Expo development server
5. ✅ Open app in Expo Go
6. ✅ Test text analysis
7. ✅ Test audio upload
8. ✅ Verify cold start handling

---

## 📞 Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review Render logs for backend errors
3. Check Expo console for frontend errors
4. Verify API configuration matches
5. Test with curl to isolate frontend/backend issues

---

## 🎉 Success Checklist

- [ ] Backend deployed on Render
- [ ] Health endpoint returns 200 OK
- [ ] API documentation accessible at /docs
- [ ] Frontend starts without errors
- [ ] App loads in Expo Go
- [ ] Text analysis works
- [ ] Audio upload works
- [ ] Risk indicators display correctly
- [ ] Alert modal appears for high risk
- [ ] Cold start handled gracefully

**You're ready to demo FraudShield AI!** 🎊