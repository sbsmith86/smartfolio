// Simple test to verify our environment setup
import { env } from './src/lib/env';

console.log('Environment validation test...');
console.log('Node version:', process.version);
console.log('Environment:', env.NODE_ENV);
console.log('Database URL configured:', !!env.DATABASE_URL);
console.log('OpenAI API Key configured:', !!env.OPENAI_API_KEY);
console.log('✅ Environment setup complete!');