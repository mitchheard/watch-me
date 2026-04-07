#!/usr/bin/env node

// Test script to verify recommendations API is working correctly
const fetch = require('node-fetch');

async function testRecommendations() {
  console.log('🧪 Testing Recommendations API...\n');
  
  try {
    // Test 1: Basic API call
    console.log('1️⃣ Testing basic API call...');
    const response = await fetch('http://localhost:3000/api/recommendations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`   ✅ Success! Got ${data.recommendations?.length || 0} recommendations`);
    console.log(`   Strategy: ${data.strategy}`);
    console.log(`   Strategy Focus: ${data.strategyFocus}`);
    console.log(`   Total Items: ${data.totalItems}`);
    
    // Test 2: Check recommendation structure
    if (data.recommendations && data.recommendations.length > 0) {
      console.log('\n2️⃣ Testing recommendation structure...');
      const rec = data.recommendations[0];
      console.log(`   First recommendation: ${rec.title}`);
      console.log(`   ID type: ${typeof rec.id} (should be string)`);
      console.log(`   Has reason: ${!!rec.reason}`);
      console.log(`   Has confidence: ${!!rec.confidence}`);
      console.log(`   Has poster: ${!!rec.tmdbPosterPath}`);
      console.log(`   Status: ${rec.status}`);
    }
    
    // Test 3: Test refresh parameter
    console.log('\n3️⃣ Testing refresh parameter...');
    const refreshResponse = await fetch('http://localhost:3000/api/recommendations?refresh=true', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      console.log(`   ✅ Refresh successful! Got ${refreshData.recommendations?.length || 0} recommendations`);
      
      // Check if results are different (randomization working)
      if (data.recommendations && refreshData.recommendations) {
        const sameFirst = data.recommendations[0]?.title === refreshData.recommendations[0]?.title;
        console.log(`   Randomization working: ${!sameFirst ? '✅ Different results' : '⚠️ Same results'}`);
      }
    } else {
      console.log(`   ❌ Refresh failed: ${refreshResponse.status}`);
    }
    
    console.log('\n✅ Recommendations API test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testRecommendations();

