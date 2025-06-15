/**
 * Cleans AI response by removing think tags, HTML entities, and other artifacts
 * @param input - The input string or object to clean
 * @returns The cleaned string
 */
const cleanAiResponse = (input: unknown): string => {
  if (!input) return '';
  
  let text: string;
  
  // Handle different input types
  if (typeof input === 'string') {
    text = input;
  } else if (typeof input === 'object' && input !== null) {
    // Handle Ollama API response format
    const response = input as Record<string, unknown>;
    if (typeof response.response === 'string') {
      text = response.response;
    } else {
      text = JSON.stringify(input);
    }
  } else {
    text = String(input);
  }
  
  // Define a series of cleaning functions
  const cleaningSteps = [
    // Remove think tags and their content (including multiline)
    (s: string) => s.replace(/<think>[\s\S]*?<\/think>/g, ''),
    
    // Replace HTML entities
    (s: string) => {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = s;
      return textarea.value;
    },
    
    // Replace Unicode escape sequences (including HTML entities in Unicode)
    (s: string) => {
      // First, handle Unicode escape sequences
      let result = s.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => 
        String.fromCharCode(parseInt(hex, 16))
      );
      
      // Then handle any HTML entities that might have been in the Unicode
      const textarea = document.createElement('textarea');
      textarea.innerHTML = result;
      return textarea.value;
    },
    
    // Replace common escape sequences
    (s: string) => s.replace(/\\n/g, '\n'),
    
    // Replace other escaped characters
    (s: string) => s.replace(/\\(["\\/bfnrt])/g, (_, char) => {
      const replacements: Record<string, string> = {
        '"': '"',
        '\\': '\\',
        '/': '/',
        'b': '\b',
        'f': '\f',
        'n': '\n',
        'r': '\r',
        't': '\t'
      };
      return replacements[char] || char;
    }),
    
    // Remove any line that's just whitespace or formatting characters
    (s: string) => s.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n'),
    
    // Remove markdown formatting
    (s: string) => s
      .replace(/#{1,6}\s*/g, '') // Headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
      .replace(/\*([^*]+)\*/g, '$1') // Italic
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/```[\s\S]*?```/g, '') // Code blocks
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1'), // Links and images
    
    // Clean up any remaining whitespace
    (s: string) => s.replace(/\s+/g, ' ').trim(),
    
    // Remove any JSON response artifacts if the entire response is a JSON string
    (s: string) => {
      try {
        const parsed = JSON.parse(s);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed.response || parsed.text || parsed.content || JSON.stringify(parsed);
        }
      } catch (e) {
        // Not a JSON string, return as is
      }
      return s;
    }
  ];
  
  // Apply all cleaning steps
  return cleaningSteps.reduce((result, step) => step(result), text);
};

export { cleanAiResponse };
