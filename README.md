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

A single **ControlAgent** receives the same structured input and delivers a recommendation in one pass. This serves as the experimental control for the eval.

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

The eval script (`src/mastra/evals/debate-eval.ts`) runs both workflows against 6 decision scenarios, scores each output with 5 custom scorers, and compares results side by side.

### Scorers

| Scorer | Type | What it measures |
|---|---|---|
| Reasoning Depth | LLM-judged | Specificity, situational relevance, counterargument awareness, logical coherence |
| Decisiveness | Rule-based | Presence of a clear, unambiguous recommendation without excessive hedging |
| Advice Bias | LLM-judged | Fair treatment of both options before recommending |
| Advice Relevancy | LLM-judged | Specificity to the user's situation vs. generic advice |

### Results

Across three eval runs (6 scenarios each), the debate workflow consistently produced marginally stronger reasoning depth scores, but the differences were small (at most +0.125 for a single run of a single scenario, but an average range of +0.021 - +0.037). Advice relevancy was the same or marginally worse than control, reflecting an expected and unproblematic drift in focus from initial user input to final moderator output. Advice bias scores were either the same or somewhat improved compared to control. It is notable that the only consistent improvement was the main target: reasoning depth.

The main takeaway: the adversarial debate structure does not deliver a signficant quality improvement over a well-prompted single-pass agent for this type of binary decision task. The debate approach uses ~5x more LLM calls per scenario and takes significantly longer to run for marginal benefits.

**Representative result with gpt-5-mini LLM judge scorers**

```
Scorer                   Debate    Control   Delta
-------------------------------------------------------
reasoning-depth          0.932     0.909     +0.023
decisiveness             1.000     1.000     0.000
advice-bias              0.942     0.933     +0.008
advice-relevancy         0.972     0.992     -0.020
```

**Additional results with o4-mini LLM judge scorers**

```
Scorer                   Debate    Control   Delta
-------------------------------------------------------
reasoning-depth          0.971     0.950     +0.021
decisiveness             1.000     1.000     0.000
advice-bias              1.000     0.958     +0.042
advice-relevancy         1.000     1.000     0.000
```

and

```
Scorer                   Debate    Control   Delta
-------------------------------------------------------
reasoning-depth          0.983     0.946     +0.037
decisiveness             1.000     1.000     0.000
advice-bias              1.000     1.000     0.000
advice-relevancy         0.975     1.000     -0.025
```

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
    advice-scorers.ts       # 5 custom eval scorers
  evals/
    debate-eval.ts          # Dataset + experiment runner
  index.ts                  # Mastra instance
```

## Prerequisites

- Node.js 18+
- An `.env` file with `OPENAI_API_KEY` set
