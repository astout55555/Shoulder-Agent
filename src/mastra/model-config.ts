import 'dotenv/config';

// Model used by the workflow agents (debate-a, debate-b, control, moderator).
// This is what the experiment is *testing*. Currently pointed at a locally hosted
// Qwen model via LM Studio to test cross-model generalizability.
export const experimentModel = {
  id: `lmstudio/${process.env.LMSTUDIO_MODEL_ID ?? 'qwen/qwen3.5-2b'}`,
  url: process.env.LMSTUDIO_BASE_URL ?? 'http://localhost:1234/v1',
} as const;

// Model used by the LLM-judge scorers (reasoning-depth, advice-bias).
// Held constant across agent-model experiments so judging quality stays comparable.
// Both judges face the same agent outputs, so what matters is consistency of the judge,
// not whether judge and agent are the same model.
export const judgeModel = 'openai/gpt-5-mini' as const;

// Cap output so LM Studio doesn't reserve the full remaining context for the response,
// which can cause 400 "Context size has been exceeded" on the moderator step where
// the input prompt is already ~9-10K tokens against a 16K context window.
export const experimentAgentDefaultOptions = {
  modelSettings: { maxOutputTokens: 2048 },
} as const;
