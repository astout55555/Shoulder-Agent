import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// -- Schemas --

const debateInputSchema = z.object({
  option1: z.string().describe('First option (Option A)'),
  option2: z.string().describe('Second option (Option B)'),
  pros1: z.string().describe('Pros of Option A'),
  pros2: z.string().describe('Pros of Option B'),
  cons1: z.string().describe('Cons of Option A'),
  cons2: z.string().describe('Cons of Option B'),
});

type DebateInitData = z.infer<typeof debateInputSchema>;

const agentPromptSchema = z.object({
  agentAPrompt: z.string(),
  agentBPrompt: z.string(),
});

const argumentSchema = z.object({
  argument: z.string(),
});

const rebuttalPromptsSchema = z.object({
  agentARebuttalPrompt: z.string(),
  agentBRebuttalPrompt: z.string(),
  agentAArgument: z.string(),
  agentBArgument: z.string(),
});

const rebuttalSchema = z.object({
  rebuttal: z.string(),
});

const moderatorPromptSchema = z.object({
  prompt: z.string(),
});

const debateOutputSchema = z.object({
  recommendation: z.string(),
  debateSummary: z.string(),
  assessment: z.string(),
  reasoning: z.string(),
});

// -- Steps --

const parseInput = createStep({
  id: 'parse-input',
  description: 'Formats user input into prompts for debate agents',
  inputSchema: debateInputSchema,
  outputSchema: agentPromptSchema,
  execute: async ({ inputData }) => {
    const context = `The user is torn between two options and wants help deciding.

Option A: ${inputData.option1}
  Pros: ${inputData.pros1}
  Cons: ${inputData.cons1}

Option B: ${inputData.option2}
  Pros: ${inputData.pros2}
  Cons: ${inputData.cons2}`;

    return {
      agentAPrompt: `${context}

You are arguing FOR Option A: "${inputData.option1}".
Present your opening argument. Make the strongest possible case for Option A.`,
      agentBPrompt: `${context}

You are arguing FOR Option B: "${inputData.option2}".
Present your opening argument. Make the strongest possible case for Option B.`,
    };
  },
});

const agentARound1 = createStep({
  id: 'agent-a-round1',
  description: 'Debate Agent A presents opening argument for Option A',
  inputSchema: agentPromptSchema,
  outputSchema: argumentSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('debateAgentA');
    if (!agent) throw new Error('Debate Agent A not found');

    const response = await agent.generate(inputData.agentAPrompt);
    return { argument: response.text };
  },
});

const agentBRound1 = createStep({
  id: 'agent-b-round1',
  description: 'Debate Agent B presents opening argument for Option B',
  inputSchema: agentPromptSchema,
  outputSchema: argumentSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('debateAgentB');
    if (!agent) throw new Error('Debate Agent B not found');

    const response = await agent.generate(inputData.agentBPrompt);
    return { argument: response.text };
  },
});

const agentARebuttal = createStep({
  id: 'agent-a-rebuttal',
  description: 'Debate Agent A rebuts Agent B opening argument',
  inputSchema: rebuttalPromptsSchema,
  outputSchema: rebuttalSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('debateAgentA');
    if (!agent) throw new Error('Debate Agent A not found');

    const response = await agent.generate(inputData.agentARebuttalPrompt);
    return { rebuttal: response.text };
  },
});

const agentBRebuttal = createStep({
  id: 'agent-b-rebuttal',
  description: 'Debate Agent B rebuts Agent A opening argument',
  inputSchema: rebuttalPromptsSchema,
  outputSchema: rebuttalSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('debateAgentB');
    if (!agent) throw new Error('Debate Agent B not found');

    const response = await agent.generate(inputData.agentBRebuttalPrompt);
    return { rebuttal: response.text };
  },
});

const moderatorJudge = createStep({
  id: 'moderator-judge',
  description: 'Moderator evaluates the full debate and renders a verdict',
  inputSchema: moderatorPromptSchema,
  outputSchema: debateOutputSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('moderatorAgent');
    if (!agent) throw new Error('Moderator Agent not found');

    const response = await agent.generate(inputData.prompt, {
      structuredOutput: {
        schema: debateOutputSchema,
      },
    });

    if (!response.object) {
      throw new Error('Moderator did not return structured output');
    }

    return response.object;
  },
});

// -- Workflow --

const debateWorkflow = createWorkflow({
  id: 'debate-workflow',
  inputSchema: debateInputSchema,
  outputSchema: debateOutputSchema,
})
  .then(parseInput)
  .parallel([agentARound1, agentBRound1])
  .map(async ({ inputData, getInitData }) => {
    const initData = getInitData<DebateInitData>();
    const agentAArgument = inputData['agent-a-round1'].argument;
    const agentBArgument = inputData['agent-b-round1'].argument;

    return {
      agentARebuttalPrompt: `This is the REBUTTAL ROUND. You previously argued for Option A: "${initData.option1}".

Here is your opponent's opening argument for Option B ("${initData.option2}"):

${agentBArgument}

Now provide your rebuttal. Address their arguments point by point and reinforce your position.`,
      agentBRebuttalPrompt: `This is the REBUTTAL ROUND. You previously argued for Option B: "${initData.option2}".

Here is your opponent's opening argument for Option A ("${initData.option1}"):

${agentAArgument}

Now provide your rebuttal. Address their arguments point by point and reinforce your position.`,
      agentAArgument,
      agentBArgument,
    };
  })
  .parallel([agentARebuttal, agentBRebuttal])
  .map(async ({ inputData, getInitData, getStepResult }) => {
    const initData = getInitData<DebateInitData>();
    const agentAArgument = getStepResult(agentARound1)?.argument ?? '';
    const agentBArgument = getStepResult(agentBRound1)?.argument ?? '';
    const agentARebuttalText = inputData['agent-a-rebuttal'].rebuttal;
    const agentBRebuttalText = inputData['agent-b-rebuttal'].rebuttal;

    return {
      prompt: `You are judging a structured debate. Here is the full context and transcript.

## Decision Context

Option A: ${initData.option1}
  Pros: ${initData.pros1}
  Cons: ${initData.cons1}

Option B: ${initData.option2}
  Pros: ${initData.pros2}
  Cons: ${initData.cons2}

## Debate Transcript

### Round 1: Opening Arguments

**Advocate for Option A ("${initData.option1}"):**
${agentAArgument}

**Advocate for Option B ("${initData.option2}"):**
${agentBArgument}

### Round 2: Rebuttals

**Option A's rebuttal:**
${agentARebuttalText}

**Option B's rebuttal:**
${agentBRebuttalText}

## Your Task

Evaluate this debate and provide your verdict.`,
    };
  })
  .then(moderatorJudge);

debateWorkflow.commit();

export { debateWorkflow };
