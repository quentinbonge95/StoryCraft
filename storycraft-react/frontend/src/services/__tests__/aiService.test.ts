// Mock the config module first
jest.mock('../../config', () => ({
  apiUrl: 'http://localhost:3000/api',
  ollamaApiUrl: 'http://localhost:11434/api',
  useMockAI: 'false',
  ollamaUrl: 'http://localhost:11434/api'
}));

// Mock axios
const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
  create: jest.fn()
};

const mockOllamaAxios = {
  get: jest.fn(),
  post: jest.fn(),
  create: jest.fn()
};

// Mock the axios module
jest.mock('axios', () => ({
  ...jest.requireActual('axios'),
  create: jest.fn((config) => {
    if (config?.baseURL?.includes('ollama')) {
      return mockOllamaAxios;
    }
    return mockAxios;
  })
}));

// Import the module after setting up mocks
import { aiService } from '../aiService';

// Mock process.env
const originalEnv = process.env;

describe('aiService', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'test' };
    
    // Default mock implementations
    mockAxios.get.mockResolvedValue({ status: 200 });
    mockOllamaAxios.get.mockResolvedValue({ status: 200 });
    mockAxios.post.mockResolvedValue({ data: { response: '{}' } });
    mockOllamaAxios.post.mockResolvedValue({ data: { response: 'Enhanced story content' } });
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('analyzeStory', () => {
    it('should analyze a story successfully', async () => {
      // Arrange
      const mockAnalysis = {
        sentiment: 'positive',
        entities: ['character', 'location']
      };
      
      mockAxios.post.mockResolvedValueOnce({
        data: { response: JSON.stringify({ analysis: mockAnalysis }) }
      });

      // Act
      const result = await aiService.analyzeStory('Test story');

      // Assert
      expect(result).toEqual(mockAnalysis);
      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/analyze',
        { content: 'Test story' },
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      // Arrange
      mockAxios.post.mockRejectedValueOnce(new Error('API Error'));

      // Act & Assert
      await expect(aiService.analyzeStory('Test story'))
        .rejects
        .toThrow('Failed to analyze story');
    });

    it('should handle invalid response format', async () => {
      // Arrange
      mockAxios.post.mockResolvedValueOnce({
        data: { response: 'invalid-json' }
      });

      // Act & Assert
      await expect(aiService.analyzeStory('Test story'))
        .rejects
        .toThrow('Invalid response format');
    });
  });

  describe('enhanceStory', () => {
    it('should enhance a story successfully', async () => {
      // Arrange
      const enhancedContent = 'Enhanced story content';
      mockOllamaAxios.post.mockResolvedValueOnce({
        data: { response: enhancedContent }
      });

      // Act
      const result = await aiService.enhanceStory('Original story');

      // Assert
      expect(result.enhancedContent).toBe(enhancedContent);
      expect(mockOllamaAxios.post).toHaveBeenCalledWith(
        '/generate',
        {
          model: 'qwen3:1.7b',
          prompt: expect.stringContaining('Original story'),
          stream: false,
          options: {
            temperature: 0.8
          }
        },
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      // Arrange
      mockOllamaAxios.post.mockRejectedValueOnce(new Error('API Error'));

      // Act & Assert
      await expect(aiService.enhanceStory('Original story'))
        .rejects
        .toThrow('Failed to enhance story');
    });
  });
});