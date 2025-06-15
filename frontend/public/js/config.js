// API Configuration - Use relative URL in production, absolute in development
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isProduction ? '/api' : 'http://localhost:8000';

// Export the configuration
window.StoryCraftConfig = {
  API_BASE_URL
};

console.log('API Base URL:', API_BASE_URL);
