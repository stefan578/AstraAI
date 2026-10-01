import { useState, useEffect, useCallback } from 'react';
import type { AIService, ProviderConfig } from '../services/ai/AIService';
import { AIServiceFactory } from '../services/ai/AIService';
import { useLocalStorage } from '../utils/localStorage';

export const useAI = () => {
  const [apiKey] = useLocalStorage('aiApiKey', '');
  const [provider] = useLocalStorage('aiProvider', 'gemini'); // default to gemini
  const [model] = useLocalStorage('aiModel', ''); // empty means use default
  const [aiService, setAiService] = useState<AIService | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const initializeAI = async () => {
      if (!apiKey) {
        if (isMounted) {
          setAiService(null);
          setError('API ključ nije podešen');
          setInitializing(false);
        }
        return;
      }

      try {
        const config: ProviderConfig = {
          name: provider,
          apiKey: apiKey,
          model: model === '' ? undefined : model,
          supportsImage: provider === 'gemini' // Assuming Gemini supports images, NVIDIA may not unless specified
        };

        const service = AIServiceFactory.create(config);
        if (isMounted) {
          setAiService(service);
          setError(null);
          setInitializing(false);
        }
      } catch (err) {
        if (isMounted) {
          setAiService(null);
          setError(err instanceof Error ? err.message : 'Greška pri inicijalizaciji AI servisa');
          setInitializing(false);
        }
      }
    };

    initializeAI();

    return () => {
      isMounted = false;
    };
  }, [apiKey, provider, model]);

  const generateText = useCallback(async (prompt: string, systemPrompt: string = ''): Promise<string> => {
    if (!aiService) {
      throw new Error('AI servis nije inicijalizovan. Proveri API ključ i provider.');
    }
    return aiService.generateText(prompt, systemPrompt);
  }, [aiService]);

  const analyzeImage = useCallback(async (imageBase64: string, prompt: string = ''): Promise<string> => {
    if (!aiService) {
      throw new Error('AI servis nije inicijalizovan. Proveri API ključ i provider.');
    }
    return aiService.analyzeImage(imageBase64, prompt);
  }, [aiService]);

  const generateFlashcards = useCallback(async (content: string): Promise<Array<{front: string; back: string}>> => {
    if (!aiService) {
      throw new Error('AI servis nije inicijalizovan. Proveri API ključ i provider.');
    }
    return aiService.generateFlashcards(content);
  }, [aiService]);

  const generateQuiz = useCallback(async (content: string, numQuestions: number = 5): Promise<Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>> => {
    if (!aiService) {
      throw new Error('AI servis nije inicijalizovan. Proveri API ključ i provider.');
    }
    return aiService.generateQuiz(content, numQuestions);
  }, [aiService]);

  const summarizeLesson = useCallback(async (content: string): Promise<string> => {
    if (!aiService) {
      throw new Error('AI servis nije inicijalizovan. Proveri API ključ i provider.');
    }
    return aiService.summarizeLesson(content);
  }, [aiService]);

  const extractKeyPoints = useCallback(async (content: string): Promise<string[]> => {
    if (!aiService) {
      throw new Error('AI servis nije inicijalizovan. Proveri API ključ i provider.');
    }
    return aiService.extractKeyPoints(content);
  }, [aiService]);

  return {
    aiService,
    initializing,
    error,
    generateText,
    analyzeImage,
    generateFlashcards,
    generateQuiz,
    summarizeLesson,
    extractKeyPoints,
  };
};