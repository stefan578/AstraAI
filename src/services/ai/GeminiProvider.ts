import type { AIService, ProviderConfig } from './AIService';

export class GeminiProvider implements AIService {
  private apiKey: string;
  private model: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'models/gemini-1.5-flash-latest'; // Default to a commonly available model
  }

  private async fetchGemini(endpoint: string, payload: any): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/${this.model}:${endpoint}?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || 'Gemini API request failed'
      );
    }

    return response.json();
  }

  async generateText(prompt: string, systemPrompt: string = ''): Promise<string> {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    const payload = {
      contents: [{
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    };

    const data = await this.fetchGemini('generateContent', payload);
    return data.candidates[0].content.parts[0].text;
  }

  async analyzeImage(imageBase64: string, prompt: string = 'Opiši sta vidis na slici.'): Promise<string> {
    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg, but could be png etc.
              data: imageBase64,
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };

    const data = await this.fetchGemini('generateContent', payload);
    return data.candidates[0].content.parts[0].text;
  }

  async generateFlashcards(content: string): Promise<Array<{front: string; back: string}>> {
    const prompt = `
      Na osnovu sledećeg sadržaja, kreiraj 5-10 flesh kartica za učenje.
      Svaka flesh kartica treba da ima pitanje (front) i odgovor (back).
      Formatiraj odgovor kao JSON niz objekata sa svojstvima "front" i "back".
      Sadržaj: ${content}
    `;

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };

    const data = await this.fetchGemini('generateContent', payload);
    const textResponse = data.candidates[0].content.parts[0].text;

    // Try to parse JSON from the response
    try {
      // Extract JSON from the response (assuming the response is just JSON or contains JSON)
      const jsonMatch = textResponse.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // If not, try to parse the whole thing
      return JSON.parse(textResponse);
    } catch (e) {
      console.error('Failed to parse flashcards JSON:', e, textResponse);
      // Fallback: return a simple array
      return [{
        front: 'Greška pri generisanju flesh kartica',
        back: 'Molimo pokušajte ponovo.'
      }];
    }
  }

  async generateQuiz(content: string, numQuestions: number = 5): Promise<Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>> {
    const prompt = `
      Na osnovu sledećeg sadržaja, kreiraj ${numQuestions} pitanja sa vierostrukim izborom.
      Za svako pitanje, ponudi 4 opcije (A, B, C, D) i naznači tacan odgovor.
      Takođe, uključi kratko objašnjenje zašto je odgovor tacan.
      Formatiraj odgovor kao JSON niz objekata sa svojim svim:
      "question": tekst pitanja,
      "options": niz od 4 strings,
      "correctAnswer": indeks tacnog odgovora (0-3),
      "explanation": objašnjenje
      Sadržaj: ${content}
    `;

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    };

    const data = await this.fetchGemini('generateContent', payload);
    const textResponse = data.candidates[0].content.parts[0].text;

    try {
      // Extract JSON from the response
      const jsonMatch = textResponse.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(textResponse);
    } catch (e) {
      console.error('Failed to parse quiz JSON:', e, textResponse);
      // Fallback
      return [{
        question: 'Greška pri generisanju kviza',
        options: ['Pokušajte ponovo', '', '', ''],
        correctAnswer: 0,
        explanation: 'Došlo je do greške pri komunikaciji sa AI servisom.'
      }];
    }
  }

  async summarizeLesson(content: string): Promise<string> {
    const prompt = `
      Sažmi sledeći sadržaj na način koji je lak shvatiti za učenika.
      Fokusiraj se na najvažnije tačke i koncepte.
      Sadržaj: ${content}
    `;

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.5,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 512,
      },
    };

    const data = await this.fetchGemini('generateContent', payload);
    return data.candidates[0].content.parts[0].text;
  }

  async extractKeyPoints(content: string): Promise<string[]> {
    const prompt = `
      Izvuci ključne tačke iz sledećeg sadržaja.
      Vrati ih kao JSON niz strings.
      Sadržaj: ${content}
    `;

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 512,
      },
    };

    const data = await this.fetchGemini('generateContent', payload);
    const textResponse = data.candidates[0].content.parts[0].text;

    try {
      const jsonMatch = textResponse.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(textResponse);
    } catch (e) {
      console.error('Failed to parse key points JSON:', e, textResponse);
      return ['Greška pri izvučenju ključnih tačkova'];
    }
  }
}