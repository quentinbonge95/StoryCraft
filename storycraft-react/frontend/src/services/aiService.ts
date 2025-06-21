import axios, { AxiosError } from 'axios';
import config from '../config';
import { cleanAiResponse } from '../utils/cleanAiResponse';
import { getAIModelSettings } from './SettingsService'; // Import to get user's selected model

// Re-export cleanAiResponse for backward compatibility
export { cleanAiResponse };

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      USE_MOCK_AI?: string;
    }
  }
}

const API_URL = 'http://localhost:8000';
const OLLAMA_TIMEOUT = 180000; // 3 minutes for Ollama responses

export interface AIAnalysisResponse {
  emotional_tone: string;
  key_themes: string;
  readability: string;
  sentiment_score: number;
  // Keeping these for backward compatibility
  emotionalArc?: string;
  keyElements?: string[];
  suggestions?: string[];
  keyThemes?: string[];
  coreMoment?: string;
  structure?: string;
  transformation?: string;
}

export interface EnhanceResponse {
  enhancedContent: string;
}

interface TitleResponse {
  title: string;
}

interface ApiError {
  message: string;
  status?: number;
}

// Handle API errors consistently
export const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const errorMessage = axiosError.response?.data?.message || axiosError.message || 'An error occurred';
    throw new Error(errorMessage);
  }
  throw error;
};

// Define the shape of our mock responses
interface MockResponses {
  analyze: AIAnalysisResponse;
  enhance: EnhanceResponse;
  generateTitle: TitleResponse;
  analyzeWithCore: AIAnalysisResponse & {
    coreMoment: string;
    structure: string;
    transformation: string;
  };
}

// Mock AI service for development
const MOCK_AI_RESPONSES: MockResponses = {
  analyze: {
    emotional_tone: 'The story has a generally positive and uplifting emotional tone with moments of tension and resolution.',
    key_themes: 'Themes of personal growth, overcoming challenges, and self-discovery are present throughout the narrative.',
    readability: 'The story is well-written with good sentence structure and vocabulary, suitable for a general audience.',
    sentiment_score: 8,
    // Keeping these for backward compatibility
    emotionalArc: 'The story has a positive emotional arc with a clear beginning, middle, and end.',
    keyElements: [
      'Clear protagonist with defined goals',
      'Challenges that create tension',
      'Satisfying resolution'
    ],
    suggestions: [
      'Add more sensory details to enhance immersion',
      'Consider varying sentence structure for better flow',
      'Expand on the emotional journey of the main character'
    ]
  },
  enhance: {
    enhancedContent: 'This is an enhanced version of your story with improved flow and added details.'
  },
  generateTitle: {
    title: 'A Compelling Story Title'
  },
  analyzeWithCore: {
    emotional_tone: 'The story has a generally positive and uplifting emotional tone with moments of tension and resolution.',
    key_themes: 'Themes of personal growth, overcoming challenges, and self-discovery are present throughout the narrative.',
    readability: 'The story is well-written with good sentence structure and vocabulary, suitable for a general audience.',
    sentiment_score: 8,
    // Keeping these for backward compatibility
    emotionalArc: 'The story has a positive emotional arc with a clear beginning, middle, and end.',
    keyElements: [
      'Clear protagonist with defined goals',
      'Challenges that create tension',
      'Satisfying resolution'
    ],
    suggestions: [
      'Add more sensory details to enhance immersion',
      'Consider varying sentence structure for better flow',
      'Expand on the emotional journey of the main character'
    ],
    coreMoment: 'The turning point where the protagonist overcomes their main challenge',
    structure: 'Classic three-act structure with clear setup, confrontation, and resolution',
    transformation: 'The protagonist grows from uncertainty to confidence'
  }
};

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Get mock AI setting from environment
const useMockAI = isDevelopment && config.useMockAI === 'true';

// Ollama API client
// Use the base URL from config which should be /ollama
// The Nginx proxy will rewrite /ollama/ to /api/ for the Ollama service
const ollamaAxios = axios.create({
  baseURL: config.ollamaUrl,
  timeout: OLLAMA_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const aiService = {
  checkApiHealth: async (): Promise<boolean> => {
    try {
      // Check both backend and Ollama health
      const [backendHealth, ollamaHealth] = await Promise.all([
        axios.get(`${API_URL}/health`).then(() => true).catch(() => false),
        ollamaAxios.get('/tags').then(() => true).catch(() => false)
      ]);
      return backendHealth && ollamaHealth;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },

  analyzeStory: async (content: string): Promise<AIAnalysisResponse> => {
    if (useMockAI) {
      console.log('Using mock analysis response');
      return MOCK_AI_RESPONSES.analyze;
    }

    try {
      console.log('Sending request for story analysis...');
      
      // Get user's selected model and provider from settings
      const settings = await getAIModelSettings();
      if (!settings) {
        throw new Error('AI model settings not found. Please configure your AI model in settings.');
      }
      
      const { model_name: model, provider } = settings;
      
      if (!model) {
        throw new Error('No AI model selected. Please select a model in settings.');
      }
      
      console.log(`Using ${provider} model: ${model}`);
      
      const prompt = `Analyze this story and provide key insights about its structure, themes, and emotional impact. 
Focus on identifying the core message, emotional arc, and key elements that make the story compelling. 
Return your analysis in a structured format with clear sections. Do not include any thinking process or analysis in the response.

${content}`;
      
      console.log('=== ANALYSIS REQUEST ===');
      console.log('Provider:', provider);
      console.log('Model:', model);
      console.log('Prompt length:', prompt.length);
      
      // Use the appropriate API based on the provider
      const api = provider === 'ollama' ? ollamaAxios : axios.create({
        baseURL: API_URL,
        timeout: OLLAMA_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': settings.api_key ? `Bearer ${settings.api_key}` : undefined,
        },
      });
      
      const endpoint = provider === 'ollama' ? '/generate' : '/api/v1/ai/analyze';
      
      const requestData = provider === 'ollama' 
        ? {
            model,
            prompt,
            stream: false,
            options: {
              temperature: 0.7,
            },
          }
        : {
            content,
            model_name: model,
          };
      
      const response = await api.post(endpoint, requestData);

      // Log the raw response for debugging
      console.log('Raw analysis response:', response.data);
      
      // Extract the response text from the Ollama API response
      const responseText = response.data?.response || '';
      console.log('Extracted response text:', responseText);
      
      // Clean the response
      const analysisText = cleanAiResponse(responseText);
      
      console.log('=== CLEANED ANALYSIS RESPONSE ===');
      console.log(analysisText);
      console.log('===============================');
      
      // Parse the cleaned response
      const result: AIAnalysisResponse = {
        emotional_tone: extractSection(analysisText, 'Emotional Tone') || 'Neutral',
        key_themes: extractSection(analysisText, 'Key Themes') || 'No key themes identified',
        readability: extractSection(analysisText, 'Readability') || 'Standard',
        sentiment_score: parseFloat(extractSection(analysisText, 'Sentiment Score') || '5'),
        // Keep old fields for backward compatibility
        emotionalArc: extractSection(analysisText, 'Emotional Arc'),
        keyElements: extractList(analysisText, 'Key Elements'),
        suggestions: extractList(analysisText, 'Suggestions'),
        coreMoment: extractSection(analysisText, 'Core Moment'),
        structure: extractSection(analysisText, 'Structure'),
        transformation: extractSection(analysisText, 'Transformation'),
      };
      
      console.log('Parsed analysis result:', result);
      return result;
    } catch (error) {
      console.error('Error in analyzeStory:', error);
      if (isDevelopment) {
        console.log('Falling back to mock data');
        return MOCK_AI_RESPONSES.analyze;
      }
      throw new Error('Failed to analyze story. Please try again later.');
    }
  },

  enhanceStory: async (content: string): Promise<EnhanceResponse> => {
    if (useMockAI) {
      console.log('Using mock enhancement response');
      return MOCK_AI_RESPONSES.enhance;
    }

    try {
      const prompt = `Enhance this story to make it more engaging and vivid while preserving its original meaning and style. 
Focus on adding sensory details, improving flow, and strengthening emotional impact. 
Return ONLY the enhanced story with NO additional commentary, thinking, or analysis. 
Do not include any tags like <think> or any other markdown. Just return the enhanced story text.\n\n${content}`;
      
      console.log('=== ENHANCEMENT REQUEST ===');
      console.log('Prompt length:', prompt.length);
      
      const startTime = Date.now();
      const response = await ollamaAxios.post('/generate', {
        model: 'qwen3:1.7b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.8,
        },
      });
      const endTime = Date.now();

      console.log('=== ENHANCEMENT RESPONSE ===');
      console.log(`Response time: ${endTime - startTime}ms`);
      
      // Log the raw response for debugging
      console.log('Raw enhancement response:', response.data);
      
      // Extract the response text from the Ollama API response
      const responseText = response.data?.response || '';
      console.log('Extracted response text:', responseText);
      
      // Clean the response
      const enhancedContent = cleanAiResponse(responseText);
      
      console.log('=== CLEANED ENHANCED CONTENT ===');
      console.log(enhancedContent);
      console.log('===============================');

      if (!enhancedContent) {
        console.error('Received empty response after cleaning');
        throw new Error('Received empty response after cleaning');
      }

      return {
        enhancedContent: enhancedContent.trim(),
      };
    } catch (error) {
      console.error('Error in enhanceStory:', error);
      if (isDevelopment) {
        console.log('Falling back to mock data');
        return MOCK_AI_RESPONSES.enhance;
      }
      throw new Error('Failed to enhance story. Please try again later.');
    }
  },

  generateTitle: async (content: string): Promise<string> => {
    if (useMockAI) {
      console.log('Using mock title generation');
      return MOCK_AI_RESPONSES.generateTitle.title;
    }

    try {
      const prompt = `Generate a concise, engaging title (1-7 words) for this story. 
Return ONLY the title with NO additional text, formatting, or analysis. 
Do not use quotes, periods, or any other punctuation.\n\n${content}`;
      
      console.log('=== TITLE GENERATION REQUEST ===');
      console.log('Prompt length:', prompt.length);
      
      const startTime = Date.now();
      const response = await ollamaAxios.post('/generate', {
        model: 'qwen3:1.7b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
        },
      });
      const endTime = Date.now();

      console.log('=== TITLE GENERATION RESPONSE ===');
      console.log(`Response time: ${endTime - startTime}ms`);
      
      // Log the raw response for debugging
      console.log('Raw title response:', response.data);
      
      // Extract the response text from the Ollama API response
      const responseText = response.data?.response || '';
      console.log('Extracted response text:', responseText);
      
      // Clean and process the title
      let title = cleanAiResponse(responseText);
      
      // Additional title-specific cleaning
      title = title
        // Remove any quotes or periods
        .replace(/["'.]/g, '')
        // Remove any markdown formatting
        .replace(/[*_#`]/g, '')
        // Remove any line breaks
        .replace(/\n/g, ' ')
        // Trim whitespace
        .trim();
      
      // Capitalize first letter of each word
      title = title
        .split(' ')
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .trim();
      
      // Ensure title is not empty
      if (!title) {
        title = 'Untitled Story';
      }
      
      // Limit to 7 words
      const words = title.split(' ');
      if (words.length > 7) {
        title = words.slice(0, 7).join(' ');
      }
      
      console.log('Final title:', title);
      return title;
    } catch (error) {
      console.error('Error in generateTitle:', error);
      if (isDevelopment) {
        console.log('Falling back to mock data');
        return MOCK_AI_RESPONSES.generateTitle.title;
      }
      throw new Error('Failed to generate title. Please try again later.');
    }
  },
};

// Helper functions to parse Ollama responses
function extractSection(text: string, sectionName: string): string {
  const regex = new RegExp(`${sectionName}:[\\s\\n]*([^\\n]+)`);
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function extractList(text: string, sectionName: string): string[] {
  const sectionRegex = new RegExp(`${sectionName}:[\\s\\n]*([\\s\\S]*?)(?=\\n\\w+:|$)`);
  const match = text.match(sectionRegex);
  if (!match) return [];
  
  // Split by lines and clean up
  return match[1]
    .split('\n')
    .map((line: string) => line.replace(/^[\\s*-]+/, '').trim())
    .filter((line: string) => line.length > 0);
}

export const checkApiHealth = aiService.checkApiHealth;
