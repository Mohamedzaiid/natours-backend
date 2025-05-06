const dotenv = require('dotenv');
const path = require('path');
const OpenAI = require('openai');

// Load environment variables from config.env
dotenv.config({ path: path.join(__dirname, '../config.env') });

console.log('Checking OpenAI API configuration...');

// Check if API key exists
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is not set in the config.env file');
  console.log('Please add the following line to your config.env file:');
  console.log('OPENAI_API_KEY=your_openai_api_key_here');
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test the API connection
async function testOpenAIConnection() {
  try {
    console.log('Testing connection to OpenAI API...');
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello, are you working?' }],
      max_tokens: 10,
    });

    console.log('✅ Successfully connected to OpenAI API');
    console.log('Response:', response.choices[0].message);
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to OpenAI API:', error.message);
    console.error('Please check your API key and internet connection');
    return false;
  }
}

// Run the test
testOpenAIConnection();
