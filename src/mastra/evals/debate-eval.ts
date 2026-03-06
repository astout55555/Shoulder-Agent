/**
 * Debate Workflow vs Control Agent Evaluation
 *
 * Compares the quality of advice from:
 * - debateWorkflow (multi-agent debate → moderator judgment)
 * - controlWorkflow (single-agent direct advice)
 *
 * Run: npx tsx src/mastra/evals/debate-eval.ts
 */

import 'dotenv/config';
import { mastra } from '../index';
import {
  reasoningDepthScorer,
  decisivenessScorer,
  adviceBiasScorer,
  adviceRelevancyScorer,
} from '../scorers/advice-scorers';

// -- Test scenarios --

const scenarios = [
  {
    input: {
      option1: 'Stay at current job',
      option2: 'Accept the new job offer',
      pros1: 'Stable income, strong relationships with team, deep knowledge of codebase, good work-life balance',
      pros2: 'Significantly higher salary, more senior title, cutting-edge tech stack, faster career growth',
      cons1: 'Below market compensation, limited promotion opportunities, tech stack becoming outdated',
      cons2: 'Unknown team culture, longer commute, startup with less job security, 6-month probation period',
    },
  },
  {
    input: {
      option1: 'Buy a house now',
      option2: 'Continue renting and invest the difference',
      pros1: 'Building equity, stable housing costs, freedom to renovate, emotional security of ownership',
      pros2: 'Flexibility to relocate, no maintenance costs, can invest in higher-return assets, lower monthly commitment',
      cons1: 'Large down payment depletes savings, maintenance responsibility, locked into one location, interest payments',
      cons2: 'Rent increases over time, no equity building, landlord restrictions, less stability',
    },
  },
  {
    input: {
      option1: 'Build a custom internal tool',
      option2: 'Buy an off-the-shelf SaaS product',
      pros1: 'Perfectly fits our workflow, no per-seat licensing fees at scale, full control over features and data',
      pros2: 'Immediate availability, vendor handles maintenance and updates, proven reliability, dedicated support team',
      cons1: 'Months of development time, ongoing maintenance burden, opportunity cost for engineering team',
      cons2: 'Monthly subscription adds up, may not fit all edge cases, data lives on vendor servers, vendor lock-in risk',
    },
  },
  {
    input: {
      option1: 'Move to a new city for a fresh start',
      option2: 'Stay in current city and make changes locally',
      pros1: 'New social environment, better job market in target city, lower cost of living, adventure and personal growth',
      pros2: 'Existing support network of friends and family, no moving costs, familiarity with area, established routines',
      cons1: 'Leaving friends and family behind, moving expenses, starting over socially, unknown neighborhoods',
      cons2: 'Same environment that led to dissatisfaction, limited job options in current field, higher cost of living',
    },
  },
  {
    input: {
      option1: 'Pursue a masters degree part-time',
      option2: 'Focus on self-directed learning and certifications',
      pros1: 'Formal credential recognized by employers, structured curriculum, networking with peers and professors, access to research',
      pros2: 'Flexible schedule, fraction of the cost, learn exactly what is relevant to career goals, can start immediately',
      cons1: 'Expensive tuition, 2-3 year commitment, rigid schedule alongside full-time work, may not teach practical skills',
      cons2: 'Less respected by some employers, requires strong self-discipline, no alumni network, harder to verify depth of knowledge',
    },
  },
  {
    // A scenario where one option is clearly stronger (to test if both approaches catch it)
    input: {
      option1: 'Accept a promotion with a 40% raise and team lead role',
      option2: 'Decline the promotion and stay in current individual contributor role',
      pros1: 'Significant salary increase, career advancement, leadership experience, more influence on technical decisions',
      pros2: 'Less stress, no management responsibilities, can focus purely on coding',
      cons1: 'More meetings, management responsibilities, less hands-on coding time',
      cons2: 'Stagnant salary, may be passed over for future opportunities, could signal lack of ambition to leadership',
    },
  },
];

function elapsed(start: number): string {
  const secs = ((Date.now() - start) / 1000).toFixed(1);
  return `${secs}s`;
}

/**
 * Run an experiment with polling-based progress logging.
 */
async function runExperimentWithProgress(
  dataset: any,
  config: {
    name: string;
    targetType: 'workflow';
    targetId: string;
    scorers: any[];
    maxConcurrency: number;
    maxRetries: number;
    itemTimeout: number;
  },
  totalItems: number,
): Promise<{ experimentId: string }> {
  const start = Date.now();

  // Start async so we can poll for progress
  const { experimentId } = await dataset.startExperimentAsync(config);
  console.log(`  Experiment started (id: ${experimentId})`);

  let lastSucceeded = 0;
  let lastFailed = 0;

  while (true) {
    await new Promise(resolve => setTimeout(resolve, 3000));

    const exp = await dataset.getExperiment({ experimentId });

    const succeeded = exp.succeededCount ?? 0;
    const failed = exp.failedCount ?? 0;
    const done = succeeded + failed;

    if (succeeded !== lastSucceeded || failed !== lastFailed) {
      console.log(`  [${elapsed(start)}] ${done}/${totalItems} items complete (${succeeded} ok, ${failed} failed)`);
      lastSucceeded = succeeded;
      lastFailed = failed;
    }

    if (exp.status === 'completed' || exp.status === 'failed') {
      console.log(`  Finished in ${elapsed(start)} — status: ${exp.status}`);
      return { experimentId };
    }
  }
}

// -- Main --

async function main() {
  const runStart = Date.now();
  console.log('=== Debate Workflow vs Control Agent Evaluation ===\n');
  console.log(`${scenarios.length} scenarios, 4 scorers, 2 workflows\n`);

  // Use a stable dataset name so it's easy to find in Studio.
  // Delete and recreate if it already exists.
  const DATASET_NAME = 'shoulder-agent-eval';
  let dataset: any;
  try {
    const { datasets: existing } = await mastra.datasets.list();
    const found = existing?.find((d: any) => d.name === DATASET_NAME);
    if (found) {
      dataset = await mastra.datasets.get({ id: found.id });
      console.log(`Reusing existing dataset "${DATASET_NAME}" (id: ${found.id})`);
    }
  } catch {
    // list/get may fail if no datasets exist yet
  }

  if (!dataset) {
    dataset = await mastra.datasets.create({
      name: DATASET_NAME,
      description: 'Binary decision scenarios for comparing debate workflow vs control agent',
    });
    console.log(`Created dataset "${DATASET_NAME}" (id: ${dataset.id})`);

    await dataset.addItems({ items: scenarios });
    console.log(`Added ${scenarios.length} items.\n`);
  } else {
    console.log(`Dataset already has items — skipping insert.\n`);
  }

  const scorers = [
    reasoningDepthScorer,
    decisivenessScorer,
    adviceBiasScorer,
    adviceRelevancyScorer,
  ];

  // Run debate workflow experiment
  console.log('--- [1/2] Debate Workflow Experiment ---');
  const debateSummary = await runExperimentWithProgress(dataset, {
    name: `debate-workflow-${Date.now()}`,
    targetType: 'workflow',
    targetId: 'debate-workflow',
    scorers,
    maxConcurrency: 2,
    maxRetries: 3,
    itemTimeout: 300_000, // 5 min per item (debate has multiple LLM calls + LLM scorers)
  }, scenarios.length);

  // Run control workflow experiment
  console.log('\n--- [2/2] Control Workflow Experiment ---');
  const controlSummary = await runExperimentWithProgress(dataset, {
    name: `control-workflow-${Date.now()}`,
    targetType: 'workflow',
    targetId: 'control-workflow',
    scorers,
    maxConcurrency: 2,
    maxRetries: 3,
    itemTimeout: 240_000, // 4 min per item (single LLM call + LLM scorers)
  }, scenarios.length);

  // Compare experiments
  console.log('\n=== Comparison ===\n');

  const comparison = await mastra.datasets.compareExperiments({
    experimentIds: [debateSummary.experimentId, controlSummary.experimentId],
    baselineId: controlSummary.experimentId,
  });

  // Aggregate scores
  const scorerNames = scorers.map(s => s.id);
  const debateScores: Record<string, number[]> = {};
  const controlScores: Record<string, number[]> = {};

  for (const name of scorerNames) {
    debateScores[name] = [];
    controlScores[name] = [];
  }

  for (const item of comparison.items) {
    const inputData = item.input as Record<string, string> | null;
    const label = inputData
      ? `"${inputData.option1}" vs "${inputData.option2}"`
      : `Item ${item.itemId}`;
    console.log(`--- ${label} ---`);

    for (const [expId, result] of Object.entries(item.results)) {
      if (!result) continue;
      const isDebate = expId === debateSummary.experimentId;
      const tag = isDebate ? 'DEBATE' : 'CONTROL';

      // Detect failed items: output is null/missing or all scores are 0/null
      const scoreValues = Object.values(result.scores);
      const allZeroOrNull = scoreValues.length === 0 || scoreValues.every(s => s === null || s === 0);
      const isFailed = !result.output && allZeroOrNull;

      if (isFailed) {
        console.log(`  [${tag}] FAILED (excluded from averages)`);
        continue;
      }

      console.log(`  [${tag}]`);
      for (const [scorerName, score] of Object.entries(result.scores)) {
        const val = score ?? 0;
        console.log(`    ${scorerName}: ${typeof val === 'number' ? val.toFixed(3) : val}`);
        if (isDebate) {
          debateScores[scorerName]?.push(typeof val === 'number' ? val : 0);
        } else {
          controlScores[scorerName]?.push(typeof val === 'number' ? val : 0);
        }
      }
    }
    console.log();
  }

  // Print averages
  const debateN = debateScores[scorerNames[0]]?.length ?? 0;
  const controlN = controlScores[scorerNames[0]]?.length ?? 0;
  console.log(`=== Average Scores (debate: ${debateN}/${scenarios.length} items, control: ${controlN}/${scenarios.length} items) ===\n`);
  console.log('Scorer'.padEnd(25) + 'Debate'.padEnd(10) + 'Control'.padEnd(10) + 'Delta');
  console.log('-'.repeat(55));

  for (const name of scorerNames) {
    const debateAvg = debateScores[name]?.length
      ? debateScores[name].reduce((a, b) => a + b, 0) / debateScores[name].length
      : 0;
    const controlAvg = controlScores[name]?.length
      ? controlScores[name].reduce((a, b) => a + b, 0) / controlScores[name].length
      : 0;
    const delta = debateAvg - controlAvg;
    const sign = delta > 0 ? '+' : '';
    console.log(
      name.padEnd(25) +
      debateAvg.toFixed(3).padEnd(10) +
      controlAvg.toFixed(3).padEnd(10) +
      `${sign}${delta.toFixed(3)}`
    );
  }

  console.log(`\nTotal time: ${elapsed(runStart)}`);
  console.log(`\nDataset "${DATASET_NAME}" and experiments are persisted in mastra.db.`);
  console.log('To view in Studio: run "npm run dev", open Datasets, and select the dataset to see experiments.');
}

main().catch(console.error);
