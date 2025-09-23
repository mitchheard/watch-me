const fetch = require('node-fetch');

async function testOpenAI() {
  try {
    console.log('Testing OpenAI API call...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: 'Return: [{"id": "test", "title": "Test Movie", "reason": "This is a test reason", "confidence": 0.8}]'
          }
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing OpenAI:', error);
  }
}

testOpenAI();
