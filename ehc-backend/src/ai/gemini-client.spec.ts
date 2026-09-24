import { GeminiBusyError, GeminiClient, errorKind } from './gemini-client';

const answer = (text: string) => ({
  ok: true,
  status: 200,
  headers: new Headers(),
  json: async () => ({ status: 'completed', steps: [{ type: 'thought' }, { type: 'model_output', content: [{ type: 'text', text }] }] }),
});
const refused = (status: number, message: string, retryAfter?: string) => ({
  ok: false,
  status,
  statusText: 'x',
  headers: new Headers(retryAfter ? { 'retry-after': retryAfter } : {}),
  json: async () => ({ error: { message } }),
});
const BUSY = (model: string) => refused(503, `${model} is currently experiencing high demand`, '30');

function makeClient(env: Record<string, string | undefined> = {}) {
  return new GeminiClient({ get: (k: string) => ({ GEMINI_API_KEY: 'key', ...env })[k] } as never);
}

describe('GeminiClient', () => {
  const fetchMock = jest.fn();
  const modelOf = (call: unknown[]) => JSON.parse((call[1] as { body: string }).body).model as string;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as never;
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  async function run(client: GeminiClient, models?: string[]) {
    const pending = client.generate({ input: 'hi', models, waitBudgetMs: 5_000 });
    pending.catch(() => undefined);
    await jest.runAllTimersAsync();
    return pending;
  }

  it('moves straight to the next model when one is busy', async () => {
    fetchMock.mockImplementation(async (_url, init) => {
      const model = JSON.parse(init.body).model;
      return model === 'a' ? BUSY(model) : answer(`from ${model}`);
    });
    await expect(run(makeClient(), ['a', 'b'])).resolves.toEqual({ text: 'from b', model: 'b' });
    expect(fetchMock.mock.calls.map(modelOf)).toEqual(['a', 'b']);
  });

  it('rests a busy model, so the next request skips it', async () => {
    fetchMock.mockImplementation(async (_url, init) => {
      const model = JSON.parse(init.body).model;
      return model === 'a' ? BUSY(model) : answer('ok');
    });
    const client = makeClient();
    await run(client, ['a', 'b']);
    await run(client, ['a', 'b']);
    expect(fetchMock.mock.calls.map(modelOf)).toEqual(['a', 'b', 'b']);
  });

  it('gives up with GeminiBusyError when every model stays busy past the wait budget', async () => {
    fetchMock.mockImplementation(async (_url, init) => BUSY(JSON.parse(init.body).model));
    await expect(run(makeClient(), ['a', 'b'])).rejects.toBeInstanceOf(GeminiBusyError);
    expect(fetchMock).toHaveBeenCalledTimes(2); // retry-after 30s is longer than the 5s budget
  });

  it('waits for a model whose rest fits the budget, then retries it', async () => {
    fetchMock.mockResolvedValueOnce(refused(429, 'Please retry in 2s.')).mockResolvedValueOnce(answer('later'));
    await expect(run(makeClient(), ['a'])).resolves.toEqual({ text: 'later', model: 'a' });
  });

  it('does not retry a request Google rejected outright', async () => {
    fetchMock.mockResolvedValue(refused(400, 'API key not valid'));
    await expect(run(makeClient(), ['a', 'b'])).rejects.toThrow('API key not valid');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('skips a retired model (404) and uses the next', async () => {
    fetchMock.mockResolvedValueOnce(refused(404, 'models/a is not found')).mockResolvedValueOnce(answer('ok'));
    await expect(run(makeClient(), ['a', 'b'])).resolves.toEqual({ text: 'ok', model: 'b' });
  });

  it('reads the model list from GEMINI_MODELS', () => {
    expect(makeClient({ GEMINI_MODELS: 'x, y' }).textModels).toEqual(['x', 'y']);
  });
});

describe('errorKind', () => {
  it('treats capacity and rate limits as busy, bad requests as rejected', () => {
    expect(errorKind(503)).toBe('busy');
    expect(errorKind(429)).toBe('busy');
    expect(errorKind(404)).toBe('missing');
    expect(errorKind(403)).toBe('rejected');
  });
});
