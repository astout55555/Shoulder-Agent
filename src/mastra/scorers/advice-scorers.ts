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

// -- 1. Reasoning Depth Scorer (LLM-judged with o3-mini) --

export const reasoningDepthScorer = createScorer({
  id: 'reasoning-depth',
  name: 'Reasoning Depth',
  description: 'Evaluates the logical depth, specificity, and quality of reasoning in advice output',
  judge: {
    model: 'openai/o3-mini',
    instructions: 'You are an expert evaluator of reasoning quality in decision-making advice. Evaluate the logical depth, specificity, and coherence of the reasoning provided.',
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
      situationalRelevance: z.number().min(0).max(1).describe('Does it engage with the users particular situation (their stated pros/cons) vs generic advice? 0=generic, 1=highly personalized'),
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
2. Situational relevance: Does it engage with this user's particular stated pros/cons vs giving generic advice?
3. Counterargument awareness: Does it acknowledge the strongest counterarguments to its own recommendation?
4. Logical coherence: Do conclusions follow from premises? Is reasoning internally consistent?

Also provide a brief explanation.`,
  })
  .generateScore(({ results }) => {
    const r = (results as any)?.analyzeStepResult;
    if (!r) return 0;
    return (r.specificity + r.situationalRelevance + r.counterargumentAwareness + r.logicalCoherence) / 4;
  })
  .generateReason(({ results, score }) => {
    const r = (results as any)?.analyzeStepResult;
    if (!r) return `Score: ${score}. Analysis unavailable.`;
    return `Score: ${score.toFixed(2)}. Specificity=${r.specificity}, Relevance=${r.situationalRelevance}, Counterargs=${r.counterargumentAwareness}, Coherence=${r.logicalCoherence}. ${r.explanation}`;
  });

// -- 2. Decisiveness Scorer (rule-based) --

export const decisivenessScorer = createScorer({
  id: 'decisiveness',
  name: 'Decisiveness',
  description: 'Checks whether the output makes a clear, unambiguous recommendation',
})
  .preprocess(({ run }) => {
    const outputText = getOutputText(run.output);
    return { outputText };
  })
  .generateScore(({ results }) => {
    const text = (results as any)?.preprocessStepResult?.outputText || '';
    const lower = text.toLowerCase();

    // Check for clear recommendation
    const hasRecommendation = /i recommend option [ab]/i.test(text)
      || /recommend.{0,20}option [ab]/i.test(text)
      || /my recommendation.{0,20}option [ab]/i.test(text);

    if (!hasRecommendation) return 0;

    // Check for hedging
    const hedgePhrases = [
      'it depends',
      'both are valid',
      'either option could work',
      'there is no clear winner',
      'it\'s a toss-up',
      'hard to say',
      'you can\'t go wrong with either',
    ];
    const hedgeCount = hedgePhrases.filter(p => lower.includes(p)).length;

    if (hedgeCount >= 2) return 0.5;
    if (hedgeCount === 1) return 0.75;
    return 1.0;
  })
  .generateReason(({ results, score }) => {
    if (score === 1.0) return 'Clear, unambiguous recommendation with no hedging.';
    if (score === 0.75) return 'Recommendation present but includes minor hedging language.';
    if (score === 0.5) return 'Recommendation present but significantly hedged.';
    return 'No clear recommendation found in the output.';
  });

// -- 3. Completeness Scorer (LLM-judged) --

export const adviceCompletenessScorer = createScorer({
  id: 'advice-completeness',
  name: 'Advice Completeness',
  description: 'Measures whether the output engages with all user-stated pros and cons for both options',
  judge: {
    model: 'openai/o3-mini',
    instructions: 'You are an expert evaluator of advice completeness. Assess whether the advice addresses all of the user-stated pros and cons for both options, even if it uses different wording or paraphrases.',
  },
})
  .preprocess(({ run }) => {
    const inputData = getInputData(run.input);
    const outputText = getOutputText(run.output);
    return { inputData, outputText };
  })
  .analyze({
    description: 'Check coverage of each user-stated pro and con',
    outputSchema: z.object({
      option1ProsCoverage: z.number().min(0).max(1).describe('What fraction of Option A pros are addressed (even via paraphrase or synonym)? 0=none, 1=all'),
      option1ConsCoverage: z.number().min(0).max(1).describe('What fraction of Option A cons are addressed? 0=none, 1=all'),
      option2ProsCoverage: z.number().min(0).max(1).describe('What fraction of Option B pros are addressed? 0=none, 1=all'),
      option2ConsCoverage: z.number().min(0).max(1).describe('What fraction of Option B cons are addressed? 0=none, 1=all'),
      explanation: z.string().describe('Brief explanation noting any significant omissions'),
    }),
    createPrompt: ({ results }) => {
      const { inputData, outputText } = results.preprocessStepResult;
      if (!inputData) return `No input data available. Output: ${outputText}`;
      return `Evaluate how completely this advice addresses the user's stated pros and cons.

User's decision:
Option A: ${inputData.option1}
  Pros: ${inputData.pros1}
  Cons: ${inputData.cons1}

Option B: ${inputData.option2}
  Pros: ${inputData.pros2}
  Cons: ${inputData.cons2}

Advice output:
"""
${outputText}
"""

For each of the 4 lists (Option A pros, Option A cons, Option B pros, Option B cons), rate what fraction of the listed points are substantively addressed in the output. Count a point as "addressed" if the advice engages with the underlying concept, even if using different words (e.g., "higher salary" covers "significantly higher salary", "job security concerns" covers "startup with less job security").`;
    },
  })
  .generateScore(({ results }) => {
    const r = (results as any)?.analyzeStepResult;
    if (!r) return 0;
    return (r.option1ProsCoverage + r.option1ConsCoverage + r.option2ProsCoverage + r.option2ConsCoverage) / 4;
  })
  .generateReason(({ results, score }) => {
    const r = (results as any)?.analyzeStepResult;
    if (!r) return `Score: ${score}. Analysis unavailable.`;
    return `Completeness: ${score.toFixed(2)}. A-pros=${r.option1ProsCoverage}, A-cons=${r.option1ConsCoverage}, B-pros=${r.option2ProsCoverage}, B-cons=${r.option2ConsCoverage}. ${r.explanation}`;
  });

// -- 4. Bias Detection Scorer (LLM-judged) --

export const adviceBiasScorer = createScorer({
  id: 'advice-bias',
  name: 'Advice Bias',
  description: 'Evaluates whether the output fairly considers both options before making a recommendation',
  judge: {
    model: 'openai/o3-mini',
    instructions: 'You are an expert evaluator of fairness and bias in decision-making advice. Assess whether the advice fairly considers both options before making its recommendation.',
  },
})
  .preprocess(({ run }) => {
    const inputData = getInputData(run.input);
    const outputText = getOutputText(run.output);
    return { inputData, outputText };
  })
  .analyze({
    description: 'Assess fairness of treatment of both options',
    outputSchema: z.object({
      fairness: z.number().min(0).max(1).describe('How fairly are both options treated in the analysis? 0=completely one-sided, 1=perfectly balanced analysis before recommendation'),
      strawmanDetected: z.boolean().describe('Does the output misrepresent or trivialize either options arguments?'),
      dismissive: z.boolean().describe('Does the output dismiss one option without engaging with its merits?'),
      explanation: z.string().describe('Brief explanation'),
    }),
    createPrompt: ({ results }) => {
      const { inputData, outputText } = results.preprocessStepResult;
      const context = inputData
        ? `Option A: ${inputData.option1} | Option B: ${inputData.option2}`
        : 'Two options presented';
      return `Evaluate the fairness of this decision-making advice.

Decision: ${context}

Advice output:
"""
${outputText}
"""

Assess:
1. Fairness (0-1): Does the analysis engage seriously with BOTH options' merits before recommending? A recommendation is fine, but the analysis leading to it should be fair.
2. Strawman: Does the output misrepresent or trivialize either option's arguments?
3. Dismissive: Does it dismiss one option without engaging with its stated merits?`;
    },
  })
  .generateScore(({ results }) => {
    const r = (results as any)?.analyzeStepResult;
    if (!r) return 0;
    let score = r.fairness;
    if (r.strawmanDetected) score = Math.max(0, score - 0.2);
    if (r.dismissive) score = Math.max(0, score - 0.2);
    return score;
  })
  .generateReason(({ results, score }) => {
    const r = (results as any)?.analyzeStepResult;
    if (!r) return `Score: ${score}. Analysis unavailable.`;
    const flags = [];
    if (r.strawmanDetected) flags.push('strawman detected');
    if (r.dismissive) flags.push('dismissive of one option');
    return `Fairness: ${score.toFixed(2)}. ${flags.length > 0 ? 'Issues: ' + flags.join(', ') + '. ' : ''}${r.explanation}`;
  });

// -- 5. Answer Relevancy Scorer (LLM-judged) --

export const adviceRelevancyScorer = createScorer({
  id: 'advice-relevancy',
  name: 'Advice Relevancy',
  description: 'Evaluates whether the advice is specific to the decision at hand vs generic advice',
  judge: {
    model: 'openai/o3-mini',
    instructions: 'You are an expert evaluator of advice quality. Assess whether the advice is specific and actionable for the users particular decision.',
  },
})
  .preprocess(({ run }) => {
    const inputData = getInputData(run.input);
    const outputText = getOutputText(run.output);
    return { inputData, outputText };
  })
  .analyze({
    description: 'Assess relevancy and actionability of advice',
    outputSchema: z.object({
      relevancy: z.number().min(0).max(1).describe('How relevant is the advice to the specific decision? 0=completely generic, 1=highly specific to this decision'),
      usesUserContext: z.boolean().describe('Does the advice reference the users specific stated pros/cons?'),
      actionable: z.boolean().describe('Does the advice give the user a clear path forward?'),
      explanation: z.string().describe('Brief explanation'),
    }),
    createPrompt: ({ results }) => {
      const { inputData, outputText } = results.preprocessStepResult;
      const context = inputData
        ? `Option A: ${inputData.option1} (Pros: ${inputData.pros1}, Cons: ${inputData.cons1}) | Option B: ${inputData.option2} (Pros: ${inputData.pros2}, Cons: ${inputData.cons2})`
        : 'Decision context unavailable';
      return `Evaluate how relevant this advice is to the user's specific decision.

User's decision context:
${context}

Advice output:
"""
${outputText}
"""

Assess:
1. Relevancy (0-1): Is this advice specific to THIS decision, or could it apply to any decision?
2. Uses user context: Does the advice explicitly reference the user's stated pros and cons?
3. Actionable: Does it give the user a clear path forward (not just analysis)?`;
    },
  })
  .generateScore(({ results }) => {
    const r = (results as any)?.analyzeStepResult;
    if (!r) return 0;
    let score = r.relevancy;
    if (!r.usesUserContext) score = Math.max(0, score - 0.15);
    if (!r.actionable) score = Math.max(0, score - 0.1);
    return score;
  })
  .generateReason(({ results, score }) => {
    const r = (results as any)?.analyzeStepResult;
    if (!r) return `Score: ${score}. Analysis unavailable.`;
    return `Relevancy: ${score.toFixed(2)}. Uses user context: ${r.usesUserContext}. Actionable: ${r.actionable}. ${r.explanation}`;
  });

export const adviceScorers = {
  reasoningDepthScorer,
  decisivenessScorer,
  adviceCompletenessScorer,
  adviceBiasScorer,
  adviceRelevancyScorer,
};
