import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { weatherWorkflow } from './workflows/weather-workflow';
import { debateWorkflow } from './workflows/debate-workflow';
import { controlWorkflow } from './workflows/control-workflow';
import { weatherAgent } from './agents/weather-agent';
import { debateAgentA } from './agents/debate-agent-a';
import { debateAgentB } from './agents/debate-agent-b';
import { moderatorAgent } from './agents/moderator-agent';
import { controlAgent } from './agents/control-agent';
import { toolCallAppropriatenessScorer, completenessScorer, translationScorer } from './scorers/weather-scorer';
import { reasoningDepthScorer, decisivenessScorer, adviceCompletenessScorer, adviceBiasScorer, adviceRelevancyScorer } from './scorers/advice-scorers';

// Use an absolute path so the DB is the same whether run from project root (eval script)
// or from .mastra/output/ (mastra dev / Studio).
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = `file:${resolve(__dirname, '../../mastra.db')}`;

export const mastra = new Mastra({
  workflows: { weatherWorkflow, debateWorkflow, controlWorkflow },
  agents: { weatherAgent, debateAgentA, debateAgentB, moderatorAgent, controlAgent },
  scorers: { toolCallAppropriatenessScorer, completenessScorer, translationScorer, reasoningDepthScorer, decisivenessScorer, adviceCompletenessScorer, adviceBiasScorer, adviceRelevancyScorer },
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: DB_PATH,
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(), // Persists traces to storage for Mastra Studio
          new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});
