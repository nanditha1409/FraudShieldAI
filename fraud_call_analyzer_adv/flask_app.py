from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from fraud_engine.engine import process_audio_text

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# API Key validation
VALID_API_KEYS = ["fraud_detection_api_key_2026", "HACKATHON_DEMO_2026"]

def validate_api_key():
    """Validate API key from request headers"""
    api_key = request.headers.get('x-api-key')
    if not api_key or api_key not in VALID_API_KEYS:
        return False
    return True

@app.route("/", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "FraudShield AI Flask API is running"})

@app.route("/health", methods=["GET"])
def health_check():
    """Additional health check endpoint"""
    return jsonify({"status": "ok", "message": "FraudShield AI Flask API is healthy"})

@app.route("/analyze", methods=["POST"])
def analyze_fraud():
    """Main fraud analysis endpoint"""
    logger.info("Received analyze request")
    
    # Validate API key
    if not validate_api_key():
        logger.warning("Invalid API key attempt")
        return jsonify({"error": "Invalid API Key. Unauthorized access."}), 403
    
    try:
        # Get JSON data from request
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        # Extract parameters
        language = data.get('language', 'en')
        audio_format = data.get('audioFormat', 'wav')
        text_input = data.get('textInput')
        audio_base64 = data.get('audioBase64')
        audio_url = data.get('audioUrl')
        
        logger.info(f"Processing request - Text input: {bool(text_input)}, Audio: {bool(audio_base64 or audio_url)}")
        
        # Validate input
        if not text_input and not audio_base64 and not audio_url:
            return jsonify({"error": "Must provide either textInput, audioBase64, or audioUrl"}), 400
        
        # Process the request
        if text_input:
            # Text-only analysis
            analysis = process_audio_text(
                text_input=text_input,
                audio_format=audio_format
            )
        elif audio_base64 or audio_url:
            # Audio analysis
            analysis = process_audio_text(
                audio_base64=audio_base64,
                audio_url=audio_url,
                audio_format=audio_format
            )
        
        logger.info(f"Analysis complete - Classification: {analysis.get('label')}, Confidence: {analysis.get('confidence')}")
        
        # Map label to classification for frontend
        label = analysis.get('label', 'SAFE')
        classification = 'FRAUD' if label != 'SAFE' else 'SAFE'
        
        # Return successful response
        response = {
            "status": "success",
            "language": language,
            "audio_format": audio_format,
            "classification": classification,
            "confidence": analysis.get('confidence'),
            "matched_keywords": analysis.get('matched_keywords', []),
            "reason": analysis.get('reason', ''),
            "transcript": analysis.get('transcript', '')
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}", exc_info=True)
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

@app.route("/detect", methods=["POST"])
def detect_fraud():
    """Alternative endpoint name for fraud detection"""
    return analyze_fraud()

@app.route("/predict", methods=["POST"])
def predict_fraud():
    """Alternative endpoint name for fraud prediction"""
    return analyze_fraud()

if __name__ == "__main__":
    # For local development
    app.run(host="0.0.0.0", port=5000, debug=True)