import type { AIService, ProviderConfig } from './AIService';

export class NvidiaProvider implements AIService {
  private apiKey: string;
  private model: string;
  private readonly baseUrl = 'https://ai.api.nvidia.com/v1';

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'nvidia/nemotron-3-super-120b-a12b'; // Default model from the environment
  }

  private async fetchNvidia(endpoint: string, payload: any): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'NVIDIA API request failed'
      );
    }

    return response.json();
  }

  async generateText(prompt: string, systemPrompt: string = ''): Promise<string> {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.95,
    };

    const data = await this.fetchNvidia('chat/completions', payload);
    return data.choices[0].message.content;
  }

  async analyzeImage(imageBase64: string, prompt: string = 'Opiši sta vidis na slici.'): Promise<string> {
    // Check if the model supports vision - for now, we'll assume it does not unless specified
    // In a real implementation, we would check the model capabilities
    // Parameters are intentionally unused in this placeholder implementation
    void imageBase64;
    void prompt;
    throw new Error('Ovaj model trenutno ne podržava rad sa slikama.');
  }

  async generateFlashcards(content: string): Promise<Array<{front: string; back: string}>> {
    const prompt = `
      Na osnovu sledećeg sadržaja, kreiraj 5-10 flesh kartica za učenje.
      Svaka flesh kartica treba da ima pitanje (front) i odgovor (back).
      Formatiraj odgovor kao JSON niz objekata sa svojstvima "front" i "back".
      Sadržaj: ${content}
    `;

    const payload = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1024,
      top_p: 0.95,
    };

    const data = await this.fetchNvidia('chat/completions', payload);
    const textResponse = data.choices[0].message.content;

    try {
      const jsonMatch = textResponse.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(textResponse);
    } catch (e) {
      console.error('Failed to parse flashcards JSON:', e, textResponse);
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
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
      top_p: 0.95,
    };

    const data = await this.fetchNvidia('chat/completions', payload);
    const textResponse = data.choices[0].message.content;

    try {
      const jsonMatch = textResponse.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(textResponse);
    } catch (e) {
      console.error('Failed to parse quiz JSON:', e, textResponse);
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
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 512,
      top_p: 0.95,
    };

    const data = await this.fetchNvidia('chat/completions', payload);
    return data.choices[0].message.content;
  }

  async extractKeyPoints(content: string): Promise<string[]> {
    const prompt = `
      Izvuci ključne tačke iz sledećeg sadržaja.
      Vrati ih kao JSON niz strings.
      Sadržaj: ${content}
    `;

    const payload = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 512,
      top_p: 0.95,
    };

    const data = await this.fetchNvidia('chat/completions', payload);
    const textResponse = data.choices[0].message.content;

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