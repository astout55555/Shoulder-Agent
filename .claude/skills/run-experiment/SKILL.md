---
name: run-experiment
description: Runs the Shoulder Agent debate workflow and tests it against the performance of the control agent, using the preset evaluations (LLM based). Provides a useful summary of results.
disable-model-invocation: false
allowed-tools: Bash(npx tsx *)
---

# General Guidelines

If there is an error, share the error with the user, investigate its cause, and recommend a fix.

# Task 1

Run the script [debate-eval.ts](scripts/debate-eval.ts).

## Details

This script will run both the control agent and the Shoulder Agent debate workflow across 4 scenarios, with 10 independent experiment runs per agent (20 experiments total). Each experiment processes all 4 scenarios.

It will execute the following 2 evaluations for each of these runs:

1. **reasoningDepthScorer**
- This is the main eval of concern for the experiment. The purpose of Shoulder Agent is to achieve a meaningfully improved score on the "reasoning depth" metric, as judged by another LLM call. If this is not improved, then that version of Shoulder Agent has no advantage over the control agent, and is just slower and more expensive.

2. **adviceBiasScorer**
- This is an LLM-judged metric. It should not drop significantly moving from the control agent's score to the Shoulder Agent's score. The debate workflow's adversarial structure is also expected to modestly improve fairness/balance on emotionally ambiguous scenarios.

The results of the runs across scenarios will be averaged and printed to the console. If any run is excluded due to a zero-score failure (see the `⚠ Excluded zero-score run` warning), the per-scenario output will annotate the valid count (e.g., `[4/5 valid]`). Note zero-score exclusions when interpreting results — they indicate underlying workflow or judge failures, not genuinely bad outputs.

# Task 2

Summarize and interpret the results.

## Details

Calculate the difference in average scores between the control agent and the Shoulder Agent (i.e. the debate workflow) for each metric.

The most important conclusion to draw is whether there is a meaningful and generally consistent trend of improvement or worsening of scores for one or more metrics between the agents (control agent and shoulder agent)--in particular, whether there is a significant improvement in reasoning depth which is not accompanied by a significant decline in the scores for other metrics.

Find any other notable trends, such as:
* A particular scenario tends to yield unusual (outlier) scores for both agents
* A particular scenario tends to yield unusual (outlier) score differentials for one or more metrics, between agents
* A metric with unreliable, highly volitile scores, across scenarios (whether for both agents or between agents)

**Per-difficulty analysis:** The 4 scenarios span the full difficulty spectrum, with one scenario per tier:
- Scenario 1 — Hard, quantitative: Buy house vs. rent (rich financial context)
- Scenario 2 — Hard, qualitative: Move to new city vs. stay (emotionally ambiguous, no quantitative anchor)
- Scenario 3 — Medium: Build custom tool vs. buy SaaS (established tradeoff framework)
- Scenario 4 — Easy: Accept promotion vs. decline (one option clearly stronger)

Report per-scenario deltas individually (no grouping — each scenario is its own data point at this scenario count). Use these to assess whether the debate workflow's benefit varies by scenario complexity and by whether the decision is quantitative vs. qualitative. Incorporate these findings into your explanations.

Attempt to provide an explanation for any identified trend in the data. This could also include criticism aimed at the design of the metric evaluations or the sample scenarios themselves. Or, the information might help explain the overall behavior of the shoulder agent compared with the control agent.

Share the following with the user:
- the printed output of the script
- the calculated score average differentials
- the difficulty-grouped delta tables
- your accompanying explanations
- any recommendations you might have for adjusting the experiment (if needed)

# Task 3

Save the full results to a file.

## Details

Write the complete results (script output, score differential table, difficulty-grouped analysis, explanations, and recommendations) to a new file at:

`.claude/skills/run-experiment/experiment-output/experiment-YYYYMMDD-HHMM.md`

Use the current date and time for the timestamp (e.g. `experiment-20260406-1423.md`).
