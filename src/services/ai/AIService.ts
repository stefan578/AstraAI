// Abstract AI service interface
export interface AIService {
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
  analyzeImage(image: string, prompt?: string): Promise<string>;
  generateFlashcards(content: string): Promise<Array<{front: string; back: string}>>;
  generateQuiz(content: string, numQuestions?: number): Promise<Array<{
    question: string;
    options: string[];
    correctAnswer: number; // index of correct option
    explanation?: string;
  }>>;
  summarizeLesson(content: string): Promise<string>;
  extractKeyPoints(content: string): Promise<string[]>;
}

// Configuration for AI providers
export interface ProviderConfig {
  name: string;
  apiKey: string;
  model?: string;
  supportsImage: boolean;
}

// Import AI service implementations
import { GeminiProvider } from './GeminiProvider';
import { NvidiaProvider } from './NvidiaProvider';

// Factory to create AI service based on provider
export class AIServiceFactory {
  static create(config: ProviderConfig): AIService {
    switch (config.name) {
      case 'gemini':
        return new GeminiProvider(config);
      case 'nvidia':
        return new NvidiaProvider(config);
      default:
        throw new Error(`Unsupported provider: ${config.name}`);
    }
  }
}