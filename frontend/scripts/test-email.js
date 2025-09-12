const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

async function testEmail() {
  try {
    console.log('Testing email configuration...');
    
    // Check if RESEND_API_KEY is set
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY environment variable is not set');
      return;
    }
    
    console.log('✅ RESEND_API_KEY is set');
    console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
    
    const resend = new Resend(apiKey);
    
    // Test sending a simple email
    console.log('Sending test email...');
    
    const result = await resend.emails.send({
      from: 'Watch Me <noreply@gowatchme.app>',
      to: ['mitchheard@gmail.com'], // Your email for testing
      subject: 'Test Email from Watch Me',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Test Email</h1>
          <p>This is a test email to verify Resend configuration.</p>
          <p>If you receive this, the email system is working correctly!</p>
        </div>
      `
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    if (error.message.includes('Invalid API key')) {
      console.error('The RESEND_API_KEY appears to be invalid');
    } else if (error.message.includes('domain')) {
      console.error('The email domain (noreply@watchme.app) may not be verified in Resend');
    } else {
      console.error('Other error:', error.message);
    }
  }
}

testEmail();
