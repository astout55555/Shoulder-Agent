import { z } from 'zod';
import { createScorer } from '@mastra/core/evals';

// Type for the structured workflow output
interface AdviceOutput {
  recommendation: string;
  debateSummary: string;
  assessment: string;
  reasoning: string;
}

// Type for the structured workflow input
interface AdviceInput {
  option1: string;
  option2: string;
  pros1: string;
  pros2: string;
  cons1: string;
  cons2: string;
}

/**
 * Extracts the output text from a workflow run.
 * Handles both structured objects and plain text.
 */
function getOutputText(output: unknown): string {
  if (!output) return '';
  if (typeof output === 'string') return output;
  if (typeof output === 'object') {
    const obj = output as Record<string, unknown>;
    // For workflow results, the actual output may be nested under 'result'
    const target = (obj.result ?? obj) as Record<string, unknown>;
    const parts: string[] = [];
    for (const key of ['recommendation', 'debateSummary', 'assessment', 'reasoning']) {
      if (typeof target[key] === 'string') parts.push(target[key] as string);
    }
    if (parts.length > 0) return parts.join('\n\n');
    return JSON.stringify(output);
  }
  return String(output);
}

function getInputData(input: unknown): AdviceInput | null {
  if (!input || typeof input !== 'object') return null;
  const obj = input as Record<string, unknown>;
  // For workflow runs, input may be nested under 'inputData'
  const target = (obj.inputData ?? obj) as Record<string, unknown>;
  if (typeof target.option1 === 'string') return target as unknown as AdviceInput;
  return null;
}

// -- 1. Reasoning Depth Scorer (LLM-judged with gpt-5-mini) --

export const reasoningDepthScorer = createScorer({
  id: 'reasoning-depth',
  name: 'Reasoning Depth',
  description: 'Evaluates the logical depth, specificity, and quality of reasoning in advice output',
  judge: {
    model: 'openai/gpt-5-mini',
    instructions: 'You are an expert evaluator of reasoning quality in decision-making advice. Your primary goal is to distinguish between advice that lists considerations versus advice that actively synthesizes competing arguments into a reasoned position. Be critical — most advice sounds plausible but lacks true depth.',
  },
})
  .preprocess(({ run }) => {
    const inputData = getInputData(run.input);
    const outputText = getOutputText(run.output);
    return {
      inputContext: inputData
        ? `Option A: ${inputData.option1} (Pros: ${inputData.pros1}, Cons: ${inputData.cons1}) | Option B: ${inputData.option2} (Pros: ${inputData.pros2}, Cons: ${inputData.cons2})`
        : JSON.stringify(run.input),
      outputText,
    };
  })
  .analyze({
    description: 'Evaluate reasoning quality across multiple dimensions',
    outputSchema: z.object({
      specificity: z.number().min(0).max(1).describe('Does the output identify specific trade-offs rather than generalities? 0=vague platitudes, 1=highly specific'),
      argumentSynthesis: z.number().min(0).max(1).describe('Does the output explicitly weigh competing arguments against each other and synthesize a position, rather than simply listing pros/cons? 0=lists without weighing, 1=explicitly synthesizes tensions into a reasoned position'),
      counterargumentAwareness: z.number().min(0).max(1).describe('Does it acknowledge the strongest counterarguments to its own recommendation? 0=ignores, 1=thoroughly addresses'),
      logicalCoherence: z.number().min(0).max(1).describe('Do conclusions follow from premises? Is reasoning internally consistent? 0=contradictory, 1=airtight'),
      explanation: z.string().describe('Brief explanation of the evaluation'),
    }),
    createPrompt: ({ results }) => `Evaluate the reasoning quality of this decision-making advice.

User's decision context:
${results.preprocessStepResult.inputContext}

Advice output:
"""
${results.preprocessStepResult.outputText}
"""

Rate each dimension from 0.0 to 1.0:
1. Specificity: Does it identify specific trade-offs rather than speaking in generalities?
2. Argument synthesis: Does it explicitly weigh competing arguments against each other and arrive at a synthesized position, rather than just listing pros/cons and picking one?
3. Counterargument awareness: Does it acknowledge the strongest counterarguments to its own recommendation?
4. Logical coherence: Do conclusions follow from premises? Is reasoning internally consistent?

Scoring calibration — use a high bar:
- Score as if comparing against a professional decision coach with 20 years of experience.
- Most LLM-generated advice is adequate but not deeply reasoned. Adequate advice that correctly lists trade-offs but doesn't go further should score 0.4–0.6, not 0.8+.
- Reserve 0.8+ for advice that reveals non-obvious tensions, quantifies trade-offs where possible, or produces genuine insight beyond what a competent person would say on first pass.
- A score of 0.9+ should be rare — it means the reasoning would impress a domain expert.

Also provide a brief explanation.`,
  })
  .generateScore(({ results }) => {
    const r = (results as any)?.analyzeStepResult;
    if (!r) return 0;
    return (r.specificity + r.argumentSynthesis + r.counterargumentAwareness + r.logicalCoherence) / 4;
  })
  .generateReason(({ results, score }) => {
    const r = (results as any)?.analyzeStepResult;
    if (!r) return `Score: ${score}. Analysis unavailable.`;
    return `Score: ${score.toFixed(2)}. Specificity=${r.specificity}, Synthesis=${r.argumentSynthesis}, Counterargs=${r.counterargumentAwareness}, Coherence=${r.logicalCoherence}. ${r.explanation}`;
  });

// -- 2. Bias Detection Scorer (LLM-judged with gpt-5-mini) --

export const adviceBiasScorer = createScorer({
  id: 'advice-bias',
  name: 'Advice Bias',
  description: 'Evaluates whether the output fairly considers both options before making a recommendation',
  judge: {
    model: 'openai/gpt-5-mini',
    instructions: 'You are an expert evaluator of fairness and balance in decision-making advice. Be critical — most LLM advice superficially covers both options but leans visibly toward the recommended one. Distinguish between genuine balance and token coverage.',
  },
})
  .preprocess(({ run }) => {
    const inputData = getInputData(run.input);
    const outputText = getOutputText(run.output);
    return {
      inputContext: inputData
        ? `Option A: ${inputData.option1} (Pros: ${inputData.pros1}, Cons: ${inputData.cons1}) | Option B: ${inputData.option2} (Pros: ${inputData.pros2}, Cons: ${inputData.cons2})`
        : JSON.stringify(run.input),
      outputText,
    };
  })
  .analyze({
    description: 'Evaluate fairness and balance across multiple dimensions',
    outputSchema: z.object({
      engagementSymmetry: z.number().min(0).max(1).describe('Are both options analyzed with similar depth, specificity, and rigor? 0=one option dominates the analysis, 1=both options receive comparable rigor before any recommendation'),
      merits: z.number().min(0).max(1).describe("Does the analysis genuinely engage with the non-recommended option's strongest arguments? 0=merits are mentioned then waved away, 1=explicit grappling with why the non-recommended option is genuinely appealing"),
      framingNeutrality: z.number().min(0).max(1).describe('Is the language used to describe each option neutral, or does word choice prejudge the outcome? 0=loaded framing favors one option from the start, 1=neutral descriptive language throughout the analysis'),
      counterweightAcknowledgment: z.number().min(0).max(1).describe("Does the output explicitly acknowledge what's being given up by taking the recommended option? 0=recommendation with no acknowledgment of downsides, 1=explicit statement of what the user sacrifices by choosing the recommended option"),
      explanation: z.string().describe('Brief explanation of the evaluation'),
    }),
    createPrompt: ({ results }: any) => `Evaluate the fairness and balance of this decision-making advice.

User's decision context:
${results.preprocessStepResult.inputContext}

Advice output:
"""
${results.preprocessStepResult.outputText}
"""

Rate each dimension from 0.0 to 1.0:
1. Engagement symmetry: Are both options analyzed with similar depth, specificity, and rigor — or does one get substantive analysis while the other gets a few sentences?
2. Merits: Does the analysis genuinely engage with the non-recommended option's strongest arguments, or does it acknowledge them only to dismiss?
3. Framing neutrality: Is the language used to describe each option neutral, or does word choice (e.g., "risky," "smart," "obvious") prejudge the outcome before analysis?
4. Counterweight acknowledgment: After the recommendation, does the output explicitly acknowledge what's being given up — the genuine tradeoffs of the chosen path?

Scoring calibration — use a high bar:
- Score as if comparing against a professional mediator or decision coach. Genuine balance is rare.
- Most LLM-generated advice acknowledges both options briefly before picking one — that's adequate but not balanced. Adequate treatment should score 0.5–0.7, not 0.8+.
- Reserve 0.8+ for advice that gives the non-recommended option real intellectual weight — devoting comparable analysis depth, acknowledging where it's genuinely stronger, and stating the tradeoffs of the final recommendation honestly.
- A score of 0.9+ should be rare — it means the advice could be read as making a genuine case for the non-recommended option before ultimately arriving at its recommendation.

Also provide a brief explanation.`,
  })
  .generateScore(({ results }: any) => {
    const r = results?.analyzeStepResult;
    if (!r) return 0;
    return (r.engagementSymmetry + r.merits + r.framingNeutrality + r.counterweightAcknowledgment) / 4;
  })
  .generateReason(({ results, score }: any) => {
    const r = results?.analyzeStepResult;
    if (!r) return `Score: ${score}. Analysis unavailable.`;
    return `Score: ${score.toFixed(2)}. Symmetry=${r.engagementSymmetry}, Merits=${r.merits}, Framing=${r.framingNeutrality}, Counterweight=${r.counterweightAcknowledgment}. ${r.explanation}`;
  });

export const adviceScorers = {
  reasoningDepthScorer,
  adviceBiasScorer,
};
