import axios from 'axios';
import { AIAnalysisClient } from '../infrastructure/ai/AIAnalysisClient';

jest.mock('axios');
const post = axios.post as jest.Mock;

describe('AIAnalysisClient', () => {
  beforeEach(() => post.mockReset());

  it('returns the parsed analysis from OpenAI', async () => {
    const body = { summary: 'ok', analysis: [{ ingredient: 'rice' }] };
    post.mockResolvedValue({ data: { choices: [{ message: { content: JSON.stringify(body) } }] } });
    const r = await new AIAnalysisClient('k').analyze({ rice: 1 }, {});
    expect(r?.summary).toBe('ok');
    expect(post.mock.calls[0][2].headers.Authorization).toBe('Bearer k');
  });

  it('returns null without calling OpenAI when there is no key', async () => {
    expect(await new AIAnalysisClient('').analyze({}, {})).toBeNull();
    expect(post).not.toHaveBeenCalled();
  });

  it('returns null on API errors or malformed output', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    post.mockRejectedValueOnce(new Error('insufficient_quota'));
    expect(await new AIAnalysisClient('k').analyze({}, {})).toBeNull();
    post.mockResolvedValueOnce({ data: { choices: [{ message: { content: '{"x":1}' } }] } });
    expect(await new AIAnalysisClient('k').analyze({}, {})).toBeNull();
  });
});
