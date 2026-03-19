import axios from 'axios';
import { ILLMPort } from '../../application/ports/ILLMPort';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenAIAdapter implements ILLMPort {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey?: string, model = 'gpt-4o') {
    this.apiKey = apiKey ?? process.env.OPENAI_API_KEY ?? '';
    this.model = model;
  }

  async complete(prompt: string): Promise<string> {
    const messages: OpenAIMessage[] = [{ role: 'user', content: prompt }];

    const response = await axios.post<OpenAIResponse>(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.model,
        messages,
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );

    return response.data.choices[0].message.content;
  }
}
