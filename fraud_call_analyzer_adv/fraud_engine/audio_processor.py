import speech_recognition as sr
import base64
import os
import io
import tempfile
import logging
import requests
from pydub import AudioSegment, effects
from pydub.silence import detect_silence

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_audio_from_url(url: str, format: str = "mp3") -> str:
    """
    Downloads audio from a URL to a temp file.
    Returns the path to the temp file.
    """
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{format}") as temp_audio:
            temp_audio.write(response.content)
            return temp_audio.name
    except Exception as e:
        logger.error(f"Failed to download audio: {e}")
        return None

def preprocess_audio(audio: AudioSegment) -> AudioSegment:
    """Normalizes and cleans audio"""
    # 1. Normalize
    normalized = effects.normalize(audio)
    # 2. Could add band-pass filters here if needed
    return normalized

def extract_acoustic_features(audio: AudioSegment) -> dict:
    """Extracts loudness, silence ratio, and duration"""
    duration = len(audio) / 1000.0
    dbfs = audio.dBFS if duration > 0 else -100
    
    # Detect silence
    silence_thresh = audio.dBFS - 16
    silence_list = detect_silence(audio, min_silence_len=500, silence_thresh=silence_thresh)
    
    total_silence = sum((end - start) for start, end in silence_list)
    silence_ratio = (total_silence / len(audio)) if len(audio) > 0 else 0
    
    return {
        "avg_db": round(dbfs, 2),
        "silence_ratio": round(silence_ratio, 2),
        "duration_sec": round(duration, 1)
    }

def process_audio_data(audio_base64: str = None, audio_url: str = None, audio_format: str = "wav") -> dict:
    """
    Decodes base64 OR downloads URL, cleans it, extracts features, and performs ASR.
    Returns dict with 'text' and 'acoustics'.
    """
    if not audio_base64 and not audio_url:
        return {"text": "", "acoustics": {}}

    temp_filename = None
    converted_filename = None
    
    try:
        # Source Handling
        if audio_url:
            logger.info(f"Downloading from {audio_url}...")
            temp_filename = download_audio_from_url(audio_url, audio_format)
            if not temp_filename:
                return {"text": "", "acoustics": {}, "error": "Download failed"}
        else:
            # Base64 Handling
            if "," in audio_base64:
                audio_base64 = audio_base64.split(",", 1)[1]
            audio_data = base64.b64decode(audio_base64)
            with tempfile.NamedTemporaryFile(delete=False, suffix=f".{audio_format}") as temp_audio:
                temp_audio.write(audio_data)
                temp_filename = temp_audio.name
            
        # Load and Preprocess
        raw_audio = AudioSegment.from_file(temp_filename)
        cleaned_audio = preprocess_audio(raw_audio)
        
        # Extract Features
        acoustics = extract_acoustic_features(cleaned_audio)
        
        # Save for ASR (always WAV)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as wav_file:
            cleaned_audio.export(wav_file.name, format="wav")
            converted_filename = wav_file.name
            
        # ASR
        recognizer = sr.Recognizer()
        with sr.AudioFile(converted_filename) as source:
            audio_content = recognizer.record(source)
            try:
                text = recognizer.recognize_google(audio_content)
                logger.info(f"Transcription: {text[:30]}...")
            except (sr.UnknownValueError, sr.RequestError):
                text = ""

        return {
            "text": text,
            "acoustics": acoustics
        }

    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        return {"text": "", "acoustics": {}, "error": str(e)}
        
    finally:
        if temp_filename and os.path.exists(temp_filename):
            os.remove(temp_filename)
        if converted_filename and os.path.exists(converted_filename):
            os.remove(converted_filename)

def process_audio_file(file_path: str) -> dict:
    """Process local file with full feature extraction"""
    if not os.path.exists(file_path):
        return {"text": "", "acoustics": {}}
        
    try:
        raw_audio = AudioSegment.from_file(file_path)
        cleaned_audio = preprocess_audio(raw_audio)
        acoustics = extract_acoustic_features(cleaned_audio)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as wav_file:
            cleaned_audio.export(wav_file.name, format="wav")
            converted_path = wav_file.name
            
        recognizer = sr.Recognizer()
        with sr.AudioFile(converted_path) as source:
            audio_content = recognizer.record(source)
            try:
                text = recognizer.recognize_google(audio_content)
            except:
                text = ""
                
        if os.path.exists(converted_path):
            os.remove(converted_path)
            
        return {"text": text, "acoustics": acoustics}
            
    except Exception as e:
        logger.error(f"Error processing file {file_path}: {e}")
        return {"text": "", "acoustics": {}}
