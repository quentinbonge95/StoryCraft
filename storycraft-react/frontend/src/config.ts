// This file provides configuration values for the application
// It can be easily mocked in tests

const config = {
  get apiUrl() {
    return import.meta.env.VITE_API_URL || 'http://localhost:8000';
  },
  get ollamaUrl() {
    return import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434/api';
  },
  get useMockAI() {
    return import.meta.env.VITE_USE_MOCK_AI || 'false';
  }
};

export default config;
