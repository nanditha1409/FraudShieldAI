// Test script to verify the Render API is working
// Run with: node test-api.js

const API_CONFIG = {
  BASE_URL: 'https://ai-fraud-detection-api-714m.onrender.com',
  API_KEY: 'fraud_detection_api_key_2026',
  TIMEOUT: 60000,
};

async function testHealthEndpoint() {
  console.log('🔍 Testing health endpoint...');
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/health`, {
      method: 'GET',
      timeout: API_CONFIG.TIMEOUT,
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health check passed:', data);
      return true;
    } else {
      console.log('❌ Health check failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

async function testTextAnalysis() {
  console.log('🔍 Testing text analysis...');
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/analyze-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_CONFIG.API_KEY,
      },
      body: JSON.stringify({
        text: 'Hello, I need your social security number and bank account details urgently for verification.',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Text analysis passed:', data);
      return true;
    } else {
      const errorData = await response.text();
      console.log('❌ Text analysis failed:', response.status, response.statusText, errorData);
      return false;
    }
  } catch (error) {
    console.log('❌ Text analysis error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting API tests for FraudShield AI...\n');
  
  const healthPassed = await testHealthEndpoint();
  console.log('');
  
  const textPassed = await testTextAnalysis();
  console.log('');
  
  if (healthPassed && textPassed) {
    console.log('🎉 All tests passed! The API is ready for Expo Go.');
  } else {
    console.log('⚠️  Some tests failed. Check the Render deployment.');
  }
}

runTests();