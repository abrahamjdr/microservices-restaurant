export interface ILLMPort {
  complete(prompt: string): Promise<string>;
}
