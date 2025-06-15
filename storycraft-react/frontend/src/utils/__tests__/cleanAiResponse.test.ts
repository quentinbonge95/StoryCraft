// Mock the environment variables
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

// Import the function to test
import { cleanAiResponse } from '../cleanAiResponse';

describe('cleanAiResponse', () => {
  // Mock document.createElement for testing
  const originalCreateElement = document.createElement;
  
  beforeAll(() => {
    // Mock document.createElement to handle textarea for HTML entity decoding
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'textarea') {
        return {
          innerHTML: '',
          get value() {
            return this.innerHTML
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
          },
          set value(text: string) {
            this.innerHTML = text;
          }
        } as HTMLTextAreaElement;
      }
      return originalCreateElement.call(document, tagName);
    });
  });

  afterAll(() => {
    // Restore original document.createElement
    document.createElement = originalCreateElement;
  });

  it('should handle empty input', () => {
    expect(cleanAiResponse('')).toBe('');
    expect(cleanAiResponse(null)).toBe('');
    expect(cleanAiResponse(undefined)).toBe('');
  });

  it('should handle simple text input', () => {
    const input = 'This is a simple text';
    expect(cleanAiResponse(input)).toBe(input);
  });

  it('should remove think tags', () => {
    const input = '<think>Some thinking</think>This is the actual response';
    expect(cleanAiResponse(input)).toBe('This is the actual response');
  });

  it('should handle multiline think tags', () => {
    const input = 'Some text before\n    <think>\n      This is a multiline\n      think tag with some analysis\n    </think>\n    This is the actual response';
    expect(cleanAiResponse(input)).toBe('Some text before This is the actual response');
  });

  it('should handle HTML entities', () => {
    const input = 'This &amp; that &lt; 5';
    expect(cleanAiResponse(input)).toBe('This & that < 5');
  });

  it('should handle Unicode escape sequences', () => {
    const input = 'This is a test: \\u0026amp; \\u003ctest\\u003e';
    expect(cleanAiResponse(input)).toBe('This is a test: & <test>');
  });

  it('should remove markdown formatting', () => {
    const input = '# Header\n**Bold** and *italic* text with `code`';
    expect(cleanAiResponse(input)).toBe('Header Bold and italic text with code');
  });
});
