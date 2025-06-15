import axios from 'axios';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current file's directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OLLAMA_URL = 'http://localhost:11434/api';
const TEST_RESULTS_DIR = join(__dirname, 'test-results');

interface TestCase {
  name: string;
  prompt: string;
  options?: any;
}

async function runTest(testCase: TestCase) {
  console.log(`\n=== Running test: ${testCase.name} ===`);
  console.log('Prompt:', testCase.prompt);
  
  try {
    const response = await axios.post(`${OLLAMA_URL}/generate`, {
      model: 'qwen3:1.7b',
      prompt: testCase.prompt,
      stream: false,
      options: {
        temperature: 0.7,
        ...testCase.options,
      },
    });

    const result = {
      testCase,
      timestamp: new Date().toISOString(),
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
      },
      rawResponse: JSON.stringify(response.data, null, 2),
    };

    // Save the full response for analysis
    const filename = `${testCase.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    const filePath = join(TEST_RESULTS_DIR, filename);
    writeFileSync(filePath, JSON.stringify(result, null, 2));
    
    console.log(`✅ Test completed. Results saved to: ${filePath}`);
    console.log('Response data structure:', Object.keys(response.data));
    
    return result;
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status:', error.response.status);
    }
    throw error;
  }
}

async function runAllTests() {
  const tests: TestCase[] = [
    {
      name: 'Simple Title Generation',
      prompt: 'Generate a short, engaging title (1-5 words) for a story about a space adventure.',
    },
    {
      name: 'Title with Think Tags',
      prompt: 'Generate a title for a story about a magical forest. <think>Make it whimsical and fun</think>',
    },
    {
      name: 'Story Analysis',
      prompt: `Analyze this story and provide key insights:\n\nThe last dinosaur on Earth sat alone in the forest. She had never seen another of her kind. Then one day, she heard a rustling in the bushes...\n\nPlease provide analysis in this format:\n\n<think>Analyzing story elements</think>\n\nEmotional Arc: [analysis]\nKey Elements: [list]\nSuggestions: [list]`,
    },
    {
      name: 'Story Enhancement',
      prompt: `Enhance this story to make it more engaging and vivid while preserving its original meaning and style. Focus on adding sensory details, improving flow, and strengthening emotional impact. Return ONLY the enhanced story with NO additional commentary, thinking, or analysis. Do not include any tags like <think> or any other markdown. Just return the enhanced story text.\n\nThe forest was dark.`,
    },
    {
      name: 'High Temperature',
      prompt: 'Generate a creative title for a story about time travel.',
      options: { temperature: 1.0 }
    },
  ];

  console.log(`Starting Ollama API tests at ${new Date().toISOString()}\n`);
  
  const results = [];
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n=== All tests completed ===');
  console.log(`Successfully ran ${results.length} tests.`);
  
  // Save a summary of all tests
  const summary = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    tests: results.map(r => ({
      name: r.testCase.name,
      status: 'success',
      file: `./${r.testCase.name.toLowerCase().replace(/\s+/g, '-')}-*.json`,
    })),
  };
  
  const summaryPath = join(TEST_RESULTS_DIR, 'test-summary.json');
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\nTest summary saved to: ${summaryPath}`);
}

// Create test-results directory if it doesn't exist
try {
  mkdirSync(TEST_RESULTS_DIR, { recursive: true });
} catch (e) {
  // Directory already exists
}

runAllTests().catch(console.error);
