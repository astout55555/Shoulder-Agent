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

A single **ControlAgent** receives the same structured input and delivers a recommendation in one pass. This serves as the experimental control for the eval. Importantly, the control agent is given an explicit, well-crafted prompt — the comparison is against a capable single-agent setup, not a naive one.

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
}```

## Evaluation

The eval script (`src/mastra/evals/debate-eval.ts`) runs both workflows against 6 decision scenarios ordered from hardest to easiest, with 3 independent experiment runs per agent (18 scored outputs per agent total). Results are aggregated and compared across runs.

### Scorers

| Scorer | Type | What it measures |
|---|---|---|
| Reasoning Depth | LLM-judged | Specificity, argument synthesis, counterargument awareness, logical coherence |
| Advice Bias | LLM-judged | Fair treatment of both options before recommending |
| Advice Relevancy | LLM-judged | Specificity to the user's situation vs. generic advice |

Reasoning Depth is the primary metric. The scorer uses a high-bar calibration modeled on a professional decision coach, specifically designed to separate advice that *lists* trade-offs from advice that *synthesizes* them into a position.

### Results

The latest experiment (N=3 runs per agent, 6 scenarios) shows the debate workflow outperforming the control on all three metrics across all 6 scenarios:

| Metric | Debate | Control | Delta |
|---|---|---|---|
| reasoning-depth | 0.774 | 0.699 | **+0.074** |
| advice-bias | 0.965 | 0.921 | **+0.044** |
| advice-relevancy | 0.998 | 0.978 | **+0.020** |

**Difficulty-grouped breakdown:**

| Group | Scenarios | RD Δ | Bias Δ | Relevancy Δ |
|---|---|---|---|---|
| Hard (1–2) | Buy/rent, Move cities | +0.088 | +0.087 | +0.005 |
| Medium (3–4) | Masters, Build/Buy SaaS | +0.042 | 0.000 | +0.028 |
| Easy (5–6) | Job switch, Promotion | +0.093 | +0.047 | +0.027 |

The reasoning depth improvement is consistent across all scenarios and difficulty levels. The debate workflow does not regress on bias or relevancy.

**A note on sample size:** These results are based on 6 scenarios × 3 runs — a small sample. Treat them as suggestive rather than conclusive. Several important caveats apply:

- The control agent's prompt was not exhaustively optimized. A more carefully engineered single-agent prompt might narrow the gap.
- LLM-judged scores have inherent variance (run-to-run spread of ~0.05–0.12 per scenario is typical).
- The scenarios were hand-picked and may not represent the full range of real decision types.

The consistent direction of improvement across all 18 debate runs and all 6 scenarios provides reasonable confidence that the signal is real, but the magnitude should not be over-interpreted at this sample size.

### Key observations

- **Concrete inputs amplify the benefit.** The hardest scenario (buy vs. rent) was enriched with specific financial figures — mortgage rates, equity estimates, rent increase percentages. This scenario shows among the strongest reasoning depth gains (+0.097), likely because the debate format is better at quantifying and weighing concrete trade-offs.

- **Emotionally ambiguous scenarios benefit more on bias.** The "Move to new city" scenario shows the largest bias delta (+0.153). The control agent's fairness scores were highly variable on this scenario (0.750–0.920), while the debate workflow was stable (0.950–1.000). Structured adversarial format appears to impose discipline on scenarios where a single agent might lean on emotional framing.

- **The debate format costs ~3–4× more tokens and takes significantly longer.** For low-stakes decisions, the added reasoning depth is probably not worth it. The format makes most sense for decisions where the added rigor is worth the extra latency and cost.

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
