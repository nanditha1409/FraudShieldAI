import re

# Multilingual + weighted fraud indicators
FRAUD_PATTERNS = {
    # English
    "otp": 0.4,
    "one time password": 0.4,
    "account blocked": 0.4,
    "bank": 0.2,
    "verify": 0.3,
    "urgent": 0.3,
    "immediately": 0.25,
    "click": 0.3,
    "transfer": 0.3,
    "upi": 0.3,
    "pin": 0.4,
    "kyc": 0.3,
    "refund": 0.3,
    "lottery": 0.4,
    "expire": 0.3,
    "cvv": 0.5,
    "credit card": 0.3,
    "debit card": 0.3,
    "download": 0.2,
    "anydesk": 0.5,
    "teamviewer": 0.5,
    "quicksupport": 0.5,
    
    # Hindi
    "turant": 0.25,
    "abhi": 0.2,
    "khata": 0.3,
    "bank se": 0.3,
    "otp batao": 0.5,
    "bhej": 0.2,
    "paise": 0.2,
    "block ho gaya": 0.4,
    
    # Tamil
    "vangi": 0.2,
    "kanakku": 0.2,
    "udane": 0.25,
    "kuriyeedu": 0.3,
    
    # Telugu
    "vente": 0.25,
    "pampandi": 0.2,
    "account block": 0.4
}

# Regex for sensitive data patterns (Data Leakage)
SENSITIVE_REGEX = {
    "OTP_Pattern": r"\b\d{4,6}\b",  # 4-6 digit codes
    "Card_Pattern": r"\b\d{16}\b",  # 16 digit card numbers
    "CVV_Pattern": r"\b\d{3}\b"     # 3 digit CVV (often near 'card')
}

URGENCY_WORDS = ["urgent", "immediately", "now", "within", "last chance", "final warning", "turant", "udane"]

def analyze_text(text: str, acoustics: dict = None):
    """
    Multimodal analysis: Text + Audio Signal
    """
    if acoustics is None:
        acoustics = {}
        
    # Default Safe
    if not text and not acoustics:
        return {
            "label": "SAFE",
            "confidence": 0.0,
            "matched_keywords": [],
            "reason": "No signal detected"
        }

    text_lower = text.lower()
    score = 0.0
    matched = []
    reasons = []

    # 1. Keyword Analysis
    for phrase, weight in FRAUD_PATTERNS.items():
        if phrase in text_lower:
            score += weight
            matched.append(phrase)
            
    # 2. Regex Analysis (Sensitive Data)
    for name, pattern in SENSITIVE_REGEX.items():
        if re.search(pattern, text):
            # Context check: strict numbers might be phone numbers, but if combined with keywords...
            if "otp" in text_lower or "code" in text_lower or "pin" in text_lower:
                score += 0.3
                matched.append(f"RegEx:{name}")
                reasons.append("Sensitive data pattern (OTP/PIN) detected")

    # 3. Urgency Analysis
    urgency_hits = sum(1 for word in URGENCY_WORDS if word in text_lower)
    if urgency_hits >= 2:
        score += 0.25
        matched.append("urgency-language")
        reasons.append("High urgency language detected")

    # 4. Acoustic Analysis (Voice Tone)
    # High dBFS (>-10dB) might indicate shouting/pressure. Normal conversation is usually -20 to -14 dBFS.
    avg_db = acoustics.get("avg_db", -99)
    if avg_db > -10.0:  # Very loud
        score += 0.2
        matched.append("high-volume")
        reasons.append("Aggressive volume levels detected (Shouting?)")
    
    # Silence Ratio: Very low silence (< 5%) means rapid fire speech (pressure tactic)
    silence_ratio = acoustics.get("silence_ratio", 0.5)
    if silence_ratio < 0.05 and len(text.split()) > 10:
        score += 0.15
        matched.append("rapid-speech")
        reasons.append("Unnatural rapid speech detected")

    # Final Classification
    confidence = round(min(score, 1.0), 2)
    
    if confidence >= 0.75:
        label = "HIGH"
    elif confidence >= 0.35:
        label = "MEDIUM"
    elif confidence > 0.1:
        label = "LOW"
    else:
        label = "SAFE"
        
    # Construct readable reason
    if matched:
        main_reason = f"Detected {label} Risk: " + ", ".join(reasons)
        if not reasons: # fall back to keywords
            main_reason = f"Detected {label} Risk Keywords: " + ", ".join(matched[:3])
    else:
        if acoustics:
            main_reason = f"Safe: No suspicious patterns. Signal verified (Loudness: {acoustics.get('avg_db', 'N/A')} dB)."
        else:
            main_reason = "Safe: Analysis complete. No suspicious linguistic or acoustic patterns detected."

    return {
        "label": label,
        "confidence": confidence,
        "matched_keywords": matched,
        "reason": main_reason,
        "acoustics": acoustics
    }
