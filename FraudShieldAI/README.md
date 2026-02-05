# FraudShield AI - Expo React Native App

Real-time voice fraud detection powered by AI, built with Expo and React Native.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Expo CLI: `npm install -g @expo/cli`
- Expo Go app on your mobile device

### Installation

1. **Install dependencies**
   ```bash
   cd FraudShieldAI
   npm install
   ```

2. **Start the development server**
   ```bash
   npm start
   ```

3. **Run on device**
   - Scan the QR code with Expo Go app
   - Or press `i` for iOS simulator, `a` for Android emulator

## 🔧 Configuration

### API Configuration
The app is pre-configured to work with the Render backend:
- **Base URL**: `https://ai-fraud-detection-api-714m.onrender.com`
- **API Key**: `fraud_detection_api_key_2026`
- **Timeout**: 60 seconds (to handle Render cold starts)

### Environment Variables
Create a `.env` file (already included):
```env
EXPO_PUBLIC_API_KEY=fraud_detection_api_key_2026
```

## 📱 Features

### ✅ Working Features
- **Text Analysis**: Type or paste call transcripts for fraud detection
- **Audio File Upload**: Select audio files from device for analysis
- **Real-time Results**: Get fraud risk scores and explanations
- **Risk Visualization**: Color-coded risk levels (Low/Medium/High)
- **Keyword Highlighting**: See suspicious phrases detected
- **Alert System**: Pop-up warnings for high-risk calls

### ⚠️ Platform Limitations
- **Live Speech Recognition**: Only works on web browsers (not in Expo Go)
- **Expo Go Workaround**: Use text input or audio file upload instead

## 🧪 Testing

### Test the API Connection
```bash
node test-api.js
```

### Manual Testing Steps
1. **Health Check**: App should load without errors
2. **Text Analysis**: 
   - Enter: "I need your social security number urgently"
   - Should show HIGH risk
3. **Audio Upload**:
   - Select any audio file
   - Should process and return results
4. **Cold Start**: First request may take 30-60 seconds

## 🔍 Troubleshooting

### Common Issues

**"Network Error" or "Unable to reach backend"**
- Check internet connection
- Verify Render service is running: https://ai-fraud-detection-api-714m.onrender.com/
- Wait for cold start (up to 60 seconds for first request)

**"Invalid API Key"**
- Verify API_KEY in App.js matches backend
- Check .env file is properly configured

**Audio upload fails**
- Ensure file is audio format (mp3, wav, m4a)
- Check file size (keep under 10MB for best performance)

**App crashes on startup**
- Clear Expo cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Debug Mode
Enable console logging by opening browser dev tools when running on web.

## 🏗️ Architecture

### Frontend Stack
- **Expo SDK 54**: Cross-platform development
- **React Native**: Mobile UI framework
- **Expo File System**: Audio file handling
- **Expo Document Picker**: File selection
- **Linear Gradient**: UI styling

### API Integration
- **RESTful API**: FastAPI backend on Render
- **Base64 Audio**: Files converted to base64 for transmission
- **JSON Responses**: Structured fraud analysis results
- **Error Handling**: Comprehensive error messages and fallbacks

### Key Components
- `App.js`: Main application component
- `API_CONFIG`: Centralized API configuration
- `useSimpleSpeechRecognition`: Web-only speech recognition hook
- Risk visualization and alert system

## 📦 Build & Deploy

### Development Build
```bash
expo start
```

### Production Build
```bash
# For app stores
expo build:android
expo build:ios

# For web deployment
expo build:web
```

## 🔐 Security Notes

- API key is included for hackathon demo purposes
- In production, use secure key management
- Backend validates all requests with API key
- CORS enabled for cross-origin requests

## 🤝 Contributing

This is a hackathon prototype. For improvements:
1. Fork the repository
2. Create feature branch
3. Test thoroughly on both platforms
4. Submit pull request

## 📄 License

Hackathon prototype - see project documentation for details.