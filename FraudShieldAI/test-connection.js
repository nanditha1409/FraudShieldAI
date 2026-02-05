// Quick connection test for FraudShield AI backend
// Run with: node test-connection.js

const API_CONFIG = {
  BASE_URL: 'https://ai-fraud-detection-api-714m.onrender.com',
  API_KEY: 'fraud_detection_api_key_2026',
  TIMEOUT: 60000,
};

async function testConnection() {
  console.log('🔍 Testing backend connection...');
  console.log(`URL: ${API_CONFIG.BASE_URL}`);
  
  // Test health endpoint
  try {
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_CONFIG.BASE_URL}/api/v1/health`, {
      method: 'GET',
      timeout: 10000,
    });
    
    console.log(`Status: ${healthResponse.status}`);
    const healthData = await healthResponse.text();
    console.log(`Response: ${healthData}`);
    
    if (healthResponse.status === 200) {
      console.log('✅ Health check passed');
    } else {
      console.log('❌ Health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
  
  // Test analyze endpoint
  try {
    console.log('\n2. Testing analyze endpoint...');
    const analyzeResponse = await fetch(`${API_CONFIG.BASE_URL}/api/v1/analyze-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_CONFIG.API_KEY,
      },
      body: JSON.stringify({
        text: 'Hello, this is a test message for fraud detection.',
      }),
      timeout: 30000,
    });
    
    console.log(`Status: ${analyzeResponse.status}`);
    const analyzeData = await analyzeResponse.text();
    console.log(`Response: ${analyzeData.substring(0, 200)}...`);
    
    if (analyzeResponse.status === 200) {
      console.log('✅ Analyze endpoint passed');
      return true;
    } else {
      console.log('❌ Analyze endpoint failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Analyze endpoint error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 FraudShield AI Backend Connection Test');
  console.log('=' .repeat(50));
  
  const success = await testConnection();
  
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 Backend is working! Expo app should work now.');
  } else {
    console.log('⚠️  Backend has issues. Check Render deployment.');
    console.log('\n💡 Possible solutions:');
    console.log('1. Redeploy the Render service');
    console.log('2. Check Render logs for errors');
    console.log('3. Verify service configuration');
    console.log('4. Run backend locally for testing');
  }
}

main().catch(console.error);