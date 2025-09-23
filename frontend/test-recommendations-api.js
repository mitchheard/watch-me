const fetch = require('node-fetch');

async function testRecommendationsAPI() {
  try {
    console.log('Testing recommendations API...');
    
    // Test without authentication first
    const response = await fetch('http://localhost:3000/api/recommendations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testRecommendationsAPI();
