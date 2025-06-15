// Mock import.meta.env for tests
const mockEnv = {
  VITE_OLLAMA_URL: 'http://localhost:11434/api'
};

// Mock import.meta.env
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: mockEnv
    }
  },
  configurable: true
});
