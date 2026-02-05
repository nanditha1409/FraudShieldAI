#!/usr/bin/env python3
"""
Deployment verification script for FraudShield AI backend.
Run this after deploying to Render to verify everything works.
"""

import requests
import json
import time

# Configuration
BASE_URL = "https://ai-fraud-detection-api-714m.onrender.com"
API_KEY = "fraud_detection_api_key_2026"
TIMEOUT = 60  # seconds

def test_health_endpoint():
    """Test the health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_text_analysis():
    """Test text analysis endpoint"""
    print("🔍 Testing text analysis...")
    try:
        headers = {
            "Content-Type": "application/json",
            "x-api-key": API_KEY
        }
        
        payload = {
            "language": "en",
            "audioFormat": "wav",
            "textInput": "Hello, I need your social security number and bank account details urgently for verification."
        }
        
        response = requests.post(
            f"{BASE_URL}/analyze",
            headers=headers,
            json=payload,
            timeout=TIMEOUT
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Text analysis passed:")
            print(f"   Status: {data.get('status')}")
            print(f"   Classification: {data.get('classification')}")
            print(f"   Confidence: {data.get('confidence')}")
            print(f"   Keywords: {data.get('matched_keywords')}")
            return True
        else:
            print(f"❌ Text analysis failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Text analysis error: {e}")
        return False

def test_api_key_validation():
    """Test API key validation"""
    print("🔍 Testing API key validation...")
    try:
        headers = {
            "Content-Type": "application/json",
            "x-api-key": "invalid_key"
        }
        
        payload = {
            "language": "en",
            "audioFormat": "wav",
            "textInput": "Test message"
        }
        
        response = requests.post(
            f"{BASE_URL}/analyze",
            headers=headers,
            json=payload,
            timeout=TIMEOUT
        )
        
        if response.status_code == 403:
            print("✅ API key validation working (correctly rejected invalid key)")
            return True
        else:
            print(f"❌ API key validation failed: Expected 403, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ API key validation error: {e}")
        return False

def test_swagger_docs():
    """Test Swagger documentation endpoint"""
    print("🔍 Testing Swagger documentation...")
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=TIMEOUT)
        if response.status_code == 200:
            print("✅ Swagger docs accessible")
            return True
        else:
            print(f"❌ Swagger docs failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Swagger docs error: {e}")
        return False

def main():
    """Run all verification tests"""
    print("🚀 Starting FraudShield AI Backend Verification...\n")
    print(f"Testing: {BASE_URL}")
    print(f"API Key: {API_KEY}")
    print(f"Timeout: {TIMEOUT}s\n")
    
    # Note about cold starts
    print("⏱️  Note: First request may take 30-60 seconds due to Render cold start\n")
    
    tests = [
        ("Health Endpoint", test_health_endpoint),
        ("Text Analysis", test_text_analysis),
        ("API Key Validation", test_api_key_validation),
        ("Swagger Documentation", test_swagger_docs),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"--- {test_name} ---")
        start_time = time.time()
        result = test_func()
        duration = time.time() - start_time
        print(f"Duration: {duration:.2f}s\n")
        results.append((test_name, result))
    
    # Summary
    print("=" * 50)
    print("VERIFICATION SUMMARY")
    print("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("\n🎉 All tests passed! Backend is ready for production.")
        print(f"📖 API Documentation: {BASE_URL}/docs")
        print(f"🔗 Health Check: {BASE_URL}/")
    else:
        print(f"\n⚠️  {len(results) - passed} test(s) failed. Check deployment.")
        print("💡 Common issues:")
        print("   - Check Render service is running")
        print("   - Verify environment variables")
        print("   - Check Render logs for errors")
        print("   - Ensure correct start command")

if __name__ == "__main__":
    main()