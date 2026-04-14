# ShoulderAgent

A multi-agent debate system for binary decision-making, built with [Mastra](https://mastra.ai/). ShoulderAgent takes a choice between two options (with user-supplied pros and cons) and routes it through a structured adversarial debate before delivering a recommendation.

## Concept

The core hypothesis: forcing two agents to argue opposite sides of a decision, then having a third agent judge the debate, should surface reasoning that a single-pass LLM call would miss — counterarguments, edge cases, and genuine trade-off analysis.

## Architecture

### Debate Workflow (the main event)

1. **DebateAgentA** argues for Option A (opening argument)
2. **DebateAgentB** argues for Option B (opening argument)
3. Both agents deliver rebuttals against the other's argument
4. **ModeratorAgent** reads the full debate and renders a judgment

Both debate agents receive the full decision context (both options, all pros and cons) so they can construct informed arguments rather than strawmen.

### Control Workflow (baseline)

A single **ControlAgent** receives the same structured input and delivers a recommendation in one pass. This serves as the experimental control for the eval. The control agent is given an explicit, well-crafted prompt — the comparison is against a capable single-agent setup, not a naive one.

### Input schema

Both workflows take the same structured input:

```json
{
  "option1": "Description of Option A",
  "option2": "Description of Option B",
  "pros1": "Comma-separated pros of A",
  "cons1": "Comma-separated cons of A",
  "pros2": "Comma-separated pros of B",
  "cons2": "Comma-separated cons of B"
}
```

### Output schema

Both workflows return the same structured output:

```json
{
  "recommendation": "Option A or Option B",
  "debateSummary": "High-level summary of the key arguments",
  "assessment": "Evaluation of both options",
  "reasoning": "Explanation for the recommendation"
}
```

## Evaluation

The eval script (`src/mastra/evals/debate-eval.ts`) runs both workflows against 4 decision scenarios ordered from hardest to easiest, with 10 independent experiment runs per agent (40 scored outputs per agent total). Results are aggregated and compared across runs.

### Scorers

| Scorer | Type | What it measures |
|---|---|---|
| Reasoning Depth | LLM-judged | Specificity, argument synthesis, counterargument awareness, logical coherence |
| Advice Bias | LLM-judged | Fair treatment of both options (4-dimension anchored calibration) |

Reasoning Depth is the primary metric. The scorer uses a high-bar calibration modeled on a professional decision coach, specifically designed to separate advice that *lists* trade-offs from advice that *synthesizes* them into a position.

Advice Bias evaluates engagement symmetry, genuine engagement with the non-recommended option's merits, framing neutrality, and counterweight acknowledgment. It uses a calibrated scale where typical LLM advice scores 0.5–0.7, reserving 0.8+ for genuinely balanced treatment.

### Results

The most recent experiment (N=10 runs per agent, 4 scenarios, 40 valid runs per agent) shows the debate workflow outperforming the control on both metrics across all 4 scenarios:

| Metric | Debate | Control | Delta |
|---|---|---|---|
| reasoning-depth | 0.789 | 0.741 | **+0.048** |
| advice-bias | 0.788 | 0.684 | **+0.104** |

**Per-scenario breakdown:**

| Scenario | Difficulty | RD Δ | Bias Δ |
|---|---|---|---|
| Buy house vs. rent | Hard, quantitative | +0.038 | +0.027 |
| Move to new city vs. stay | Hard, qualitative | +0.055 | +0.149 |
| Build custom tool vs. buy SaaS | Medium | +0.035 | +0.081 |
| Accept promotion vs. decline | Easy | **+0.065** | **+0.157** |

The reasoning depth improvement is positive across all scenarios and difficulty levels. The debate workflow does not regress on bias.

**A note on certainty:** These results are based on 4 hand-picked scenarios and have not been subjected to a formal significance test (p-value). The experiment provides meaningful evidence but should not be treated as a statistically rigorous conclusion. Additional caveats:

- The control agent's prompt was not exhaustively optimized. A more carefully engineered single-agent prompt might narrow the gap.
- LLM-judged scores have inherent variance — run-to-run spread of ~0.05–0.15 per scenario is typical, especially on emotionally ambiguous scenarios.
- The scenarios were designed to span the difficulty spectrum but may not represent the full range of real decision types.

### Key observations

- **The signal is consistent across multiple experiments.** Four independent experiments (N=3, N=3, N=5, N=10) all show positive reasoning depth deltas. The pooled estimate across the two latest same-methodology runs (N=5 + N=10, 59 debate / 60 control runs) is **+0.053** — stable enough to suggest the effect is real rather than noise.

- **The debate format adds the most value on easy, lopsided scenarios.** The promotion scenario (clearly one correct answer) shows the *highest* reasoning depth delta (+0.065). When one option is obviously stronger, a single-pass agent tends to shortcut genuine construction of the opposing case. The debate format forces the assigned advocate to build real arguments for declining, which surface as acknowledged trade-offs in the final recommendation.

- **Emotionally ambiguous scenarios benefit most on bias.** "Move to new city" shows the largest bias delta (+0.149) and the most volatile control agent scores (0.525–0.713 per run). Without a structured adversarial format, the control agent drifts toward whichever framing — adventure vs. stability — it gravitates to first. The debate structure imposes balance by design.

- **Quantitative inputs reduce the bias advantage.** The buy/rent scenario has rich symmetric financial data (specific mortgage rates, equity estimates, investment returns), and the control agent scores 0.798 on bias — its highest across all scenarios. When both options have concrete numbers attached, even a single-pass agent is naturally guided toward symmetric engagement. The debate format's bias benefit is smaller when the raw inputs already scaffold balance.

- **The debate format costs ~3–4× more tokens and takes significantly longer.** For low-stakes decisions, the added reasoning depth is probably not worth it. The format makes most sense for decisions where the added rigor is worth the extra latency and cost.

### Experiment design history

The current structure is the result of iterative refinement across several runs:

- **Initial design:** 6 scenarios, 3 scorers (reasoning-depth, advice-bias, advice-relevancy), N=3 per agent.
- **Advice-relevancy removed:** Both agents scored at or near the ceiling (0.98–1.00) on every run, producing no discriminating signal. Removed after the first two experiments.
- **Two scenarios removed:** One "medium" difficulty scenario was removed because it was an outlier with variable results, indicating that the scenario was probably not well-formed. It was also redundant with the other "medium" scenario. The less simple of the two "easy" scenarios was also removed, leaving only 2 hard scenarios (1 quantitative, 1 qualitative), 1 medium, and 1 easy.
- **Bias scorer redesigned:** The original bias scorer clustered both agents near the ceiling (debate ~0.97, control ~0.92), making separation difficult to interpret. Redesigned with 4 explicit dimensions and calibration anchors that push typical LLM advice into the 0.5–0.7 range. Scores from before and after this change are not directly comparable.
- **N increased from 3 → 5 → 10:** Early runs had wide enough per-scenario variance to obscure the signal. N=10 with no interruptions provides the cleanest data to date.

## Running the project

### Dev server (Mastra Studio)

```bash
npm run dev
```

Opens Studio at [http://localhost:4111](http://localhost:4111) — use this to run workflows interactively and browse experiment results in the Datasets tab.

### Eval script

```bash
npx tsx src/mastra/evals/debate-eval.ts
```

Runs both workflows against the full scenario set, scores the outputs, and prints a side-by-side comparison. Results are persisted to `mastra.db` and visible in Studio under Datasets → `shoulder-agent-eval`.

## Project structure

```
src/mastra/
  agents/
    debate-agent-a.ts       # Argues for Option A
    debate-agent-b.ts       # Argues for Option B
    moderator-agent.ts      # Judges the debate
    control-agent.ts        # Single-pass advisor (baseline)
  workflows/
    debate-workflow.ts      # Full debate orchestration
    control-workflow.ts     # Single-step control wrapper
  scorers/
    advice-scorers.ts       # Custom eval scorers
  evals/
    debate-eval.ts          # Dataset + experiment runner
  index.ts                  # Mastra instance
```

## Prerequisites

- Node.js 18+
- An `.env` file with `OPENAI_API_KEY` set
