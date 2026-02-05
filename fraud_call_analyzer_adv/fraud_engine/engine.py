from fraud_engine.rules import analyze_text
from fraud_engine.audio_processor import process_audio_data

def process_audio_text(audio_base64: str = None, audio_url: str = None, audio_format: str = "wav", text_input: str = None):
    """
    Main entry point for the engine.
    Orchestrates Audio Processing -> Feature Extraction -> Rule Engine.
    """
    transcript = ""
    acoustics = {}
    
    if text_input:
        transcript = text_input
        # Mock acoustics for text-only input
        acoustics = {"avg_db": -20.0, "silence_ratio": 0.2}
    elif audio_base64 or audio_url:
        # Full Audio Pipeline
        result = process_audio_data(audio_base64=audio_base64, audio_url=audio_url, audio_format=audio_format)
        
        # Propagate processing errors
        if result.get("error"):
            return {
                "classification": "ERROR",
                "confidence": 0.0,
                "matched_keywords": [],
                "reason": f"Processing Failed: {result['error']}",
                "transcript": "",
                "acoustics": {}
            }

        transcript = result.get("text", "")
        acoustics = result.get("acoustics", {})
    
    # If silence/failure but we have acoustic signal of shouting?
    # We still analyze.
    
    # Analyze the transcript + acoustics
    analysis_result = analyze_text(transcript, acoustics)

    return {
        "classification": analysis_result["label"],
        "confidence": analysis_result["confidence"],
        "matched_keywords": analysis_result["matched_keywords"],
        "reason": analysis_result["reason"],
        "transcript": transcript,
        "acoustics": acoustics # Return metadata for debugging/UI
    }
