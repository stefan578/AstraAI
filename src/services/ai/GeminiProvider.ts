import type { AIService, ProviderConfig } from './AIService';

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

export class GeminiProvider implements AIService {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey.trim();
    this.model = GeminiProvider.normalizeModel(config.model);
  }

  private static normalizeModel(model?: string): string {
    const requested = (model || '').trim().replace(/^models\//, '');

    // Migrate old AstraAI/localStorage values that are no longer suitable
    // for new Gemini API projects.
    if (
      !requested ||
      requested === 'gemini-1.5-flash-latest' ||
      requested === 'gemini-1.5-flash' ||
      requested === 'gemini-2.5-flash'
    ) {
      return 'gemini-3.8-flash';
    }

    return requested;
  }

  private async fetchGemini(endpoint: string, payload: unknown): Promise<GeminiResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API ključ nije podešen.');
    }

    const response = await fetch(
      `${this.baseUrl}/${this.model}:${endpoint}?key=${encodeURIComponent(this.apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = (await response.json().catch(() => ({}))) as GeminiResponse;

    if (!response.ok) {
      throw new Error(
        data.error?.message || `Gemini API zahtev nije uspeo (HTTP ${response.status}).`
      );
    }

    return data;
  }

  private extractText(data: GeminiResponse): string {
    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();

    if (!text) {
      throw new Error('Gemini nije vratio tekstualni odgovor.');
    }

    return text;
  }

  private async generate(prompt: string, systemPrompt = '', maxOutputTokens = 2048): Promise<string> {
    const contents = [
      ...(systemPrompt
        ? [{ role: 'user', parts: [{ text: `Sistemska instrukcija: ${systemPrompt}` }] }]
        : []),
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    const data = await this.fetchGemini('generateContent', {
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens,
      },
    });

    return this.extractText(data);
  }

  async generateText(prompt: string, systemPrompt = ''): Promise<string> {
    return this.generate(prompt, systemPrompt, 2048);
  }

  async analyzeImage(
    imageBase64: string,
    prompt = 'Opiši šta vidiš na slici i objasni relevantne informacije za učenika.'
  ): Promise<string> {
    const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    const mimeType = match?.[1] || 'image/jpeg';
    const data = match?.[2] || imageBase64;

    const response = await this.fetchGemini('generateContent', {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    return this.extractText(response);
  }

  private async generateJson<T>(prompt: string, maxOutputTokens = 2048): Promise<T> {
    const data = await this.fetchGemini('generateContent', {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens,
        responseMimeType: 'application/json',
      },
    });

    const textResponse = this.extractText(data);

    try {
      return JSON.parse(textResponse) as T;
    } catch {
      const jsonMatch = textResponse.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Gemini nije vratio validan JSON odgovor.');
      }
      return JSON.parse(jsonMatch[0]) as T;
    }
  }

  async generateFlashcards(content: string): Promise<Array<{ front: string; back: string }>> {
    return this.generateJson(
      `Na osnovu sledećeg sadržaja kreiraj 5-10 flash kartica za učenje.
Vrati ISKLJUČIVO JSON niz objekata oblika {"front":"pitanje","back":"odgovor"}.
Sadržaj:
${content}`,
      2048
    );
  }

  async generateQuiz(
    content: string,
    numQuestions = 5
  ): Promise<Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>> {
    return this.generateJson(
      `Na osnovu sledećeg sadržaja kreiraj ${numQuestions} pitanja sa četiri ponuđena odgovora.
Vrati ISKLJUČIVO JSON niz objekata oblika:
{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"..."}
correctAnswer mora biti indeks tačnog odgovora od 0 do 3.
Sadržaj:
${content}`,
      4096
    );
  }

  async summarizeLesson(content: string): Promise<string> {
    return this.generate(
      `Sažmi sledeći sadržaj tako da ga učenik lako razume. Fokusiraj se na najvažnije pojmove i činjenice.

Sadržaj:
${content}`,
      '',
      1024
    );
  }

  async extractKeyPoints(content: string): Promise<string[]> {
    return this.generateJson(
      `Izvuci najvažnije ključne tačke iz sledećeg sadržaja.
Vrati ISKLJUČIVO JSON niz stringova.

Sadržaj:
${content}`,
      1024
    );
  }
}
