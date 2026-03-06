import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

const controlInputSchema = z.object({
  option1: z.string().describe('First option (Option A)'),
  option2: z.string().describe('Second option (Option B)'),
  pros1: z.string().describe('Pros of Option A'),
  pros2: z.string().describe('Pros of Option B'),
  cons1: z.string().describe('Cons of Option A'),
  cons2: z.string().describe('Cons of Option B'),
});

const controlOutputSchema = z.object({
  recommendation: z.string(),
  debateSummary: z.string(),
  assessment: z.string(),
  reasoning: z.string(),
});

const controlStep = createStep({
  id: 'control-step',
  description: 'Single-pass advice from control agent with structured output',
  inputSchema: controlInputSchema,
  outputSchema: controlOutputSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('controlAgent');
    if (!agent) throw new Error('Control Agent not found');

    const prompt = `The user is torn between two options and wants help deciding.

Option A: ${inputData.option1}
  Pros: ${inputData.pros1}
  Cons: ${inputData.cons1}

Option B: ${inputData.option2}
  Pros: ${inputData.pros2}
  Cons: ${inputData.cons2}

Consider both options and provide your recommendation.`;

    const response = await agent.generate(prompt, {
      structuredOutput: {
        schema: controlOutputSchema,
      },
    });

    if (!response.object) {
      throw new Error('Control agent did not return structured output');
    }

    return response.object;
  },
});

const controlWorkflow = createWorkflow({
  id: 'control-workflow',
  inputSchema: controlInputSchema,
  outputSchema: controlOutputSchema,
})
  .then(controlStep);

controlWorkflow.commit();

export { controlWorkflow };
