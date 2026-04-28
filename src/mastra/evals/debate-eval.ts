/**
 * Debate Workflow vs Control Agent Evaluation
 *
 * Compares the quality of advice from:
 * - debateWorkflow (multi-agent debate → moderator judgment)
 * - controlWorkflow (single-agent direct advice)
 *
 * Runs each experiment 5 times per agent to reduce LLM non-determinism noise.
 *
 * Run: npx tsx src/mastra/evals/debate-eval.ts
 */

import 'dotenv/config';
import { mastra } from '../index';
import {
  reasoningDepthScorer,
  adviceBiasScorer,
} from '../scorers/advice-scorers';

// -- Test scenarios (ordered hardest → easiest for difficulty-grouped analysis) --

const scenarios = [
  {
    // Hardest: financial modeling + opportunity cost + deeply personal, no dominant option
    input: {
      option1: 'Buy a house now',
      option2: 'Continue renting and invest the difference',
      pros1: '$420k home at 6.8% rate locks in $2,100/mo mortgage that builds ~$800/mo in equity after year 1, in a market averaging 4% annual home appreciation, plus mortgage interest tax deduction',
      pros2: 'Current rent is $1,650/mo, investing the $1,250/mo difference into index funds averaging 10% historical returns, maintaining $85k liquid savings for career or investment opportunities',
      cons1: '$84k down payment drops emergency fund to $15k, estimated $4,200/yr in maintenance and insurance, $180k total interest over 30 years, locked into one location',
      cons2: 'Rent increased 6% last year with no cap on future increases, zero equity after 10 years of renting, no tax deductions, subject to landlord decisions on renewal',
    },
  },
  {
    // Hard: network/life tradeoffs, highly context-dependent
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
    // Medium: classic product/eng tradeoff with established frameworks
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
    // Easiest: one option is clearly stronger
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

const RUNS_PER_AGENT = 10;

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
): Promise<{ experimentId: string; failedCount: number }> {
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
      return { experimentId, failedCount: lastFailed };
    }
  }
}

// -- Main --

export async function main() {
  const runStart = Date.now();
  console.log('=== Debate Workflow vs Control Agent Evaluation ===\n');
  console.log(`${scenarios.length} scenarios, 2 scorers, 2 workflows, ${RUNS_PER_AGENT} runs each\n`);

  // Dataset setup: keep a stable dataset, clear and re-add items each run (bumps version)
  const DATASET_NAME = 'shoulder-agent-eval';
  let dataset: any;

  try {
    const { datasets: existing } = await mastra.datasets.list();
    const found = existing?.find((d: any) => d.name === DATASET_NAME);
    if (found) {
      dataset = await mastra.datasets.get({ id: found.id });
      const existingItems = await dataset.listItems();
      const items: any[] = Array.isArray(existingItems) ? existingItems : existingItems.items;

      // If current items already match target scenarios, no mutation needed (avoids version bump).
      const inputsMatch =
        items.length === scenarios.length &&
        items.every((it, idx) => JSON.stringify(it.input) === JSON.stringify(scenarios[idx].input));

      if (inputsMatch) {
        console.log(`Dataset "${DATASET_NAME}" (id: ${found.id}) — ${scenarios.length} items already match, no version bump.\n`);
      } else {
        // Update overlap slots in place, then add/delete to converge on scenarios.length.
        // This keeps the dataset non-empty throughout, avoiding the empty intermediate version
        // that a delete-then-add sequence would produce.
        const overlap = Math.min(items.length, scenarios.length);
        for (let i = 0; i < overlap; i++) {
          await dataset.updateItem({ itemId: items[i].id, input: scenarios[i].input });
        }
        if (items.length > scenarios.length) {
          const extras = items.slice(scenarios.length).map((i: any) => i.id);
          await dataset.deleteItems({ itemIds: extras });
        } else if (scenarios.length > items.length) {
          const toAdd = scenarios.slice(items.length);
          await dataset.addItems({ items: toAdd });
        }
        console.log(`Updated dataset "${DATASET_NAME}" (id: ${found.id}) — ${scenarios.length} items in place, no empty intermediate version.\n`);
      }
    }
  } catch {
    // list/get may fail if no datasets exist yet
  }

  if (!dataset) {
    dataset = await mastra.datasets.create({
      name: DATASET_NAME,
      description: 'Binary decision scenarios for comparing debate workflow vs control agent',
    });
    await dataset.addItems({ items: scenarios });
    console.log(`Created dataset "${DATASET_NAME}" (id: ${dataset.id}) with ${scenarios.length} items.\n`);
  }

  const scorers = [
    reasoningDepthScorer,
    adviceBiasScorer,
  ];

  console.log(`--- Debate Workflow Experiments (${RUNS_PER_AGENT} runs) ---`);
  const debateExpIds: string[] = [];
  for (let i = 0; i < RUNS_PER_AGENT; i++) {
    console.log(`\n  Run ${i + 1}/${RUNS_PER_AGENT}:`);
    const { experimentId } = await runExperimentWithProgress(dataset, {
      name: `debate-run-${i + 1}-${Date.now()}`,
      targetType: 'workflow',
      targetId: 'debate-workflow',
      scorers,
      maxConcurrency: 1,
      maxRetries: 3,
      itemTimeout: 600_000,
    }, scenarios.length);
    debateExpIds.push(experimentId);
  }

  console.log(`\n--- Control Workflow Experiments (${RUNS_PER_AGENT} runs) ---`);
  const controlExpIds: string[] = [];
  for (let i = 0; i < RUNS_PER_AGENT; i++) {
    console.log(`\n  Run ${i + 1}/${RUNS_PER_AGENT}:`);
    const { experimentId } = await runExperimentWithProgress(dataset, {
      name: `control-run-${i + 1}-${Date.now()}`,
      targetType: 'workflow',
      targetId: 'control-workflow',
      scorers,
      maxConcurrency: 1,
      maxRetries: 3,
      itemTimeout: 600_000,
    }, scenarios.length);
    controlExpIds.push(experimentId);
  }

  // Collect scores from all experiments via storage (compareExperiments deduplicates, so we query directly)
  console.log('\n=== Comparison ===\n');

  const allExpIds = [...debateExpIds, ...controlExpIds];
  const debateExpIdSet = new Set(debateExpIds);
  const scorerNames = scorers.map(s => s.id);

  const storage = mastra.getStorage();
  const expStore = await (storage as any).getStore('experiments');
  const scoresStore = await (storage as any).getStore('scores');

  // Map itemId -> scenario label
  const itemLabels: Record<string, string> = {};
  const { results: firstExpResults } = await expStore.listExperimentResults({
    experimentId: debateExpIds[0],
    pagination: { page: 0, perPage: 100 },
  });
  for (const r of firstExpResults) {
    const input = r.input as Record<string, string>;
    itemLabels[r.itemId] = input?.option1 || r.itemId;
  }

  // Collect scores: scores table has runId=experimentId, entityId=itemId
  type ScenarioScores = { debate: Record<string, number[]>; control: Record<string, number[]> };
  const scenarioData: Record<string, ScenarioScores> = {};

  for (const sid of scorerNames) {
    const { scores: scoreRows } = await scoresStore.listScoresByScorerId({
      scorerId: sid,
      pagination: { page: 0, perPage: 500 },
    });
    for (const s of scoreRows) {
      if (!allExpIds.includes(s.runId)) continue;
      const itemId = s.entityId;
      const agentType = debateExpIdSet.has(s.runId) ? 'debate' : 'control';

      // Exact-zero scores from LLM-judged scorers indicate an analyze-step failure
      // (scorers' generateScore returns 0 via the `if (!r) return 0` null-guard path
      // when the judge call errored or the workflow output was empty). Exclude from
      // aggregation — averaging zeros in corrupted the last experiment's results.
      if (s.score === 0) {
        const label = itemLabels[itemId] || itemId;
        console.log(`⚠ Excluded zero-score run: scenario="${label}" scorer=${sid} agent=${agentType} exp=${s.runId}`);
        continue;
      }

      if (!scenarioData[itemId]) {
        scenarioData[itemId] = {
          debate: Object.fromEntries(scorerNames.map(n => [n, []])),
          control: Object.fromEntries(scorerNames.map(n => [n, []])),
        };
      }
      scenarioData[itemId][agentType][sid].push(s.score);
    }
  }

  // Sort scenarios by difficulty order (matching the scenarios array)
  const difficultyOrder = scenarios.map(s => s.input.option1);
  const sorted = Object.entries(scenarioData).sort(([a], [b]) => {
    const ai = difficultyOrder.indexOf(itemLabels[a] || '');
    const bi = difficultyOrder.indexOf(itemLabels[b] || '');
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // Print per-scenario results
  const debateAllScores: Record<string, number[]> = Object.fromEntries(scorerNames.map(n => [n, []]));
  const controlAllScores: Record<string, number[]> = Object.fromEntries(scorerNames.map(n => [n, []]));

  for (const [itemId, scores] of sorted) {
    const label = itemLabels[itemId] || itemId;
    console.log(`--- "${label}" ---`);
    for (const agentType of ['DEBATE', 'CONTROL'] as const) {
      const key = agentType.toLowerCase() as 'debate' | 'control';
      const runs = scores[key][scorerNames[0]]?.length ?? 0;
      console.log(`  [${agentType}] (${runs} runs)`);
      for (const name of scorerNames) {
        const vals = scores[key][name] ?? [];
        if (vals.length === 0) {
          console.log(`    ${name}: no valid data`);
        } else {
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
          const individual = vals.map(v => v.toFixed(3)).join(', ');
          const countNote = vals.length < RUNS_PER_AGENT ? ` [${vals.length}/${RUNS_PER_AGENT} valid]` : '';
          console.log(`    ${name}: ${avg.toFixed(3)}${countNote} (${individual})`);
        }
      }
      for (const name of scorerNames) {
        if (key === 'debate') debateAllScores[name].push(...(scores.debate[name] ?? []));
        else controlAllScores[name].push(...(scores.control[name] ?? []));
      }
    }
    console.log();
  }

  // Print overall averages
  const debateN = debateAllScores[scorerNames[0]]?.length ?? 0;
  const controlN = controlAllScores[scorerNames[0]]?.length ?? 0;
  console.log(`=== Average Scores (debate: ${debateN} runs, control: ${controlN} runs) ===\n`);
  console.log('Scorer'.padEnd(25) + 'Debate'.padEnd(10) + 'Control'.padEnd(10) + 'Delta');
  console.log('-'.repeat(55));

  for (const name of scorerNames) {
    const debateAvg = debateAllScores[name].length
      ? debateAllScores[name].reduce((a, b) => a + b, 0) / debateAllScores[name].length
      : 0;
    const controlAvg = controlAllScores[name].length
      ? controlAllScores[name].reduce((a, b) => a + b, 0) / controlAllScores[name].length
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
