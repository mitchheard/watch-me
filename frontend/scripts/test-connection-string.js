const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConnectionString() {
  try {
    console.log('Testing PostgreSQL connection string...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in environment');
      return;
    }
    
    // Parse the connection string
    const url = new URL(process.env.DATABASE_URL);
    console.log('Host:', url.hostname);
    console.log('Port:', url.port);
    console.log('Database:', url.pathname.slice(1));
    console.log('Username:', url.username);
    console.log('Password:', url.password ? 'Set' : 'Not set');
    
    // Test connection with pg client
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    
    console.log('Attempting to connect...');
    await client.connect();
    console.log('✅ PostgreSQL connection successful');
    
    // Test a simple query
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query successful:', result.rows[0]);
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('DNS resolution failed - check if the hostname is correct');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('Connection refused - check if the port is correct and the server is running');
    } else if (error.message.includes('authentication')) {
      console.error('Authentication failed - check username/password');
    }
  }
}

testConnectionString();
