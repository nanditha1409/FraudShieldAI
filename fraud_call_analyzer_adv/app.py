from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import logging
from fraud_engine.engine import process_audio_text

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="FraudShield AI - Fraud Call Analyzer",
    description="Real-time voice fraud detection API powered by AI",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow ALL origins (hackathon-friendly)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    language: str = Field(default="en", description="Language of the call (e.g., 'en', 'hi')")
    audio_format: str = Field(default="wav", alias="audioFormat", description="Format of the audio (e.g., 'wav', 'mp3')")
    audio_base64: Optional[str] = Field(None, alias="audioBase64", description="Base64 encoded audio string")
    audio_url: Optional[str] = Field(None, alias="audioUrl", description="URL to download the audio file from")
    text_input: Optional[str] = Field(None, alias="textInput", description="Direct text input for analysis (no audio)")

    class Config:
        populate_by_name = True

@app.post("/analyze")
def analyze_call(
    request: AnalyzeRequest,
    x_api_key: Optional[str] = Header(None)
):
    # API Key Security for Hackathon - Support multiple keys
    VALID_API_KEYS = ["fraud_detection_api_key_2026", "HACKATHON_DEMO_2026"]
    
    logger.info(f"Received request with API key: {x_api_key[:10]}..." if x_api_key else "No API key provided")
    
    if x_api_key not in VALID_API_KEYS:
        logger.warning(f"Invalid API key attempt: {x_api_key}")
        raise HTTPException(status_code=403, detail="Invalid API Key. Unauthorized access.")

    try:
        logger.info(f"Processing request - Text input: {bool(request.text_input)}, Audio: {bool(request.audio_base64 or request.audio_url)}")
        
        # Support both audio and text input
        if request.text_input:
            # Text-only analysis
            analysis = process_audio_text(
                text_input=request.text_input,
                audio_format=request.audio_format
            )
        elif request.audio_base64 or request.audio_url:
            # Audio analysis
            analysis = process_audio_text(
                audio_base64=request.audio_base64,
                audio_url=request.audio_url,
                audio_format=request.audio_format
            )
        else:
            raise HTTPException(status_code=400, detail="Must provide either audio_base64, audio_url, or text_input")

        logger.info(f"Analysis complete - Classification: {analysis.get('classification')}, Confidence: {analysis.get('confidence')}")
        
        return {
            "status": "success",
            "language": request.language,
            "audio_format": request.audio_format,
            **analysis
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/")
def health():
    return {"status": "ok", "message": "Fraud Call Analyzer API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Fraud Call Analyzer API is healthy"}

if __name__ == "__main__":
    import uvicorn
    # Use port 8000 to match the tester requirement
    uvicorn.run(app, host="0.0.0.0", port=8000)
