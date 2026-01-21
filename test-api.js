// Quick API test script - run this in browser console
// Paste this in browser console (F12) to test API endpoints

const baseURL = "http://192.168.1.12:8000";

async function testEndpoint(endpoint) {
  try {
    console.log(`Testing ${endpoint}...`);
    const res = await fetch(`${baseURL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await res.json();
    console.log(`✅ ${endpoint}:`, {
      status: res.status,
      statusText: res.statusText,
      data: data
    });
    return true;
  } catch (err) {
    console.error(`❌ ${endpoint}:`, err.message);
    return false;
  }
}

// Test all endpoints
async function testAllEndpoints() {
  console.log("=== Testing API Endpoints ===");
  
  const endpoints = [
    '/rooms/',
    '/room/',
    '/tenant/',
    '/tenants/',
    '/payments/',
    '/payment/',
  ];
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    console.log('---');
  }
}

// Run it
testAllEndpoints();
