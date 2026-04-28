# ShoulderAgent

A multi-agent debate system for binary decision-making, built with [Mastra](https://mastra.ai/). ShoulderAgent takes a choice between two options (with user-supplied pros and cons) and routes it through a structured adversarial debate before delivering a recommendation.

## Abstract

This project tests whether a structured multi-agent debate (two advocate agents + a moderator) produces measurably better decision-making advice than a well-prompted single-agent baseline, and whether any advantage generalizes across model scales. Across two model classes (`openai/gpt-5-mini` and a locally hosted `qwen/qwen3.5-2b` via LM Studio) and a 4-scenario set spanning hard-quantitative, hard-qualitative, medium, and easy difficulty, the debate workflow shows a **statistically significant improvement on both reasoning depth and advice bias** at every pool size tested.

**Key findings:**

1. **The debate advantage is real and survives prompt-engineering.** On gpt-5-mini at N=94 vs N=104 (debate vs control), pooled deltas are RD +0.026 (d=0.69, p<10⁻⁵) and Bias +0.076 (d=0.96, p<10⁻⁹). This held after the control agent's prompt was rewritten to match the debate workflow's structural rigor — the gap shrank but did not close.
2. **The advantage *grows* on a weaker model.** On qwen3.5-2b at N=160 vs N=160 (with judges held constant on gpt-5-mini), pooled deltas are RD +0.062 (d=0.50, p≈10⁻⁵) and Bias +0.096 (d=0.52, p<10⁻⁵) — larger absolute deltas than on gpt-5-mini. The architectural support helps more where the underlying model is weaker.
3. **The per-scenario picture is bimodal on the weaker model.** Three scenarios show very-large positive effects (Cohen's d up to 3.05); one scenario (Move to new city) shows a Bonferroni-significant *negative* Bias effect (d=−0.98) — a specific failure mode where a weak moderator introduces bias on emotionally ambiguous decisions that the single-pass control happens to handle well by hedging.
4. **Bias improvement looks more architectural than reasoning depth on a strong model**: on gpt-5-mini, all 4 bias scenarios pass Bonferroni vs only 2 of 4 reasoning-depth scenarios — suggesting that a well-structured single-pass prompt can largely reproduce reasoning decomposition, but producing genuinely balanced treatment of both options is harder without explicit adversarial structure.
5. **Cost.** The debate workflow uses ~4× more LLM calls than the control (2 openings + 2 rebuttals + 1 moderator vs 1) and takes ~7× longer per scenario in wall-clock terms. The format makes sense for decisions where the added rigor justifies the latency, especially decisions involving emotional ambiguity or quantitative reasoning beyond the model's comfort zone.

All claims above are backed by significance testing (Welch's t-test, Mann-Whitney U cross-checks, Bonferroni correction across 8 per-scenario tests) and are reproducible on the same source data; the qwen-model analysis was independently verified by a hand-rolled re-implementation of every statistical primitive.

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

The eval script (`src/mastra/evals/debate-eval.ts`) runs both workflows against 4 decision scenarios spanning the full difficulty spectrum, with N independent experiment runs per agent. Results are aggregated and compared across runs, then pooled across same-configuration experiments for significance analysis.

The 4 scenarios:

1. **Buy house vs. rent** (hard, quantitative — rich financial inputs)
2. **Move to new city vs. stay** (hard, qualitative — emotionally ambiguous)
3. **Build custom tool vs. buy SaaS** (medium — established tradeoff framework)
4. **Accept promotion vs. decline** (easy — one option clearly stronger)

### Scorers

| Scorer | Type | What it measures |
|---|---|---|
| Reasoning Depth | LLM-judged | Specificity, argument synthesis, counterargument awareness, logical coherence |
| Advice Bias | LLM-judged | Fair treatment of both options (4-dimension anchored calibration) |

Reasoning Depth is the primary metric. The scorer uses a high-bar calibration modeled on a professional decision coach, specifically designed to separate advice that *lists* trade-offs from advice that *synthesizes* them into a position.

Advice Bias evaluates engagement symmetry, genuine engagement with the non-recommended option's merits, framing neutrality, and counterweight acknowledgment. It uses a calibrated scale where typical LLM advice scores 0.5–0.7, reserving 0.8+ for genuinely balanced treatment.

The judge is held at `openai/gpt-5-mini` across all experiments so judging quality is constant when the agent-side model varies. This makes cross-model deltas directly comparable; absolute scores depend on the judge's calibration.

## Results

### Headline numbers — two model classes, same scenarios and judge

| Agent model | Pool | RD Δ | RD d | RD p | Bias Δ | Bias d | Bias p |
|---|---|---|---|---|---|---|---|
| **gpt-5-mini** | N=94 vs 104 | +0.026 | 0.69 | <10⁻⁵ | +0.076 | 0.96 | <10⁻⁹ |
| **qwen3.5-2b (LM Studio)** | N=160 vs 160 | **+0.062** | 0.50 | ≈10⁻⁵ | **+0.096** | 0.52 | <10⁻⁵ |

Both effects are statistically significant on both models, and the **absolute delta is larger on the weaker model** — the debate architecture provides more help where the underlying model is weaker. Effect-size point estimates (Cohen's d) are smaller on Qwen because of higher per-cell variance, not because the per-scenario effects are smaller (several Qwen cells reach d > 2.4).

### Per-scenario significance (Bonferroni-corrected, α = 0.00625 across 8 tests)

| Scenario | gpt-5-mini RD | gpt-5-mini Bias | Qwen RD | Qwen Bias |
|---|---|---|---|---|
| Buy house | n.s. (d=0.40) | ✓ d=1.15 | **✓✓ d=2.71** | **✓✓ d=3.05** |
| Move to new city | ✓ d=0.84 | ✓ d=2.11 | ✓ d=0.81 | **✗✗ d=−0.98 (negative)** |
| Build vs SaaS | uncorr-only | ✓ d=1.38 | n.s. | n.s. |
| Accept promotion | ✓ d=1.07 | ✓ d=1.82 | ✓ d=0.82 | **✓✓ d=2.47** |

✓ = passes Bonferroni (positive). ✓✓ = passes Bonferroni at very large effect (|d|>2). ✗✗ = passes Bonferroni at large effect but in the *wrong* direction (debate worse than control). n.s. = not significant.

The 8 cells of the Qwen pool include 6 Bonferroni-significant effects: 5 positive, 1 negative. This is a more polarized result than the gpt-5-mini pool, where 6 of 8 cells pass Bonferroni and all 6 are positive.

### Detailed analyses

- **gpt-5-mini pool (post-optimization):** [significance-analysis-20260424-2.md](.claude/skills/statistical-analysis/analysis-output/significance-analysis-20260424-2.md) — N=94/104 across 4 same-config experiments, both agent prompts hand-optimized.
- **Qwen pool:** [significance-analysis-20260427-qwen-n40.md](.claude/skills/statistical-analysis/analysis-output/significance-analysis-20260427-qwen-n40.md) — N=160/160 across 3 same-config experiments. Verified by two independent statistical implementations.

## Discussion

### What the debate workflow seems to be doing

Across both models and all four scenarios, two patterns recur:

- **The debate workflow extracts more analysis from a model than a single pass does.** Reasoning depth is positive everywhere (gpt-5-mini all 4 scenarios; Qwen 3 of 4). The mechanism appears to be that requiring an advocate to build a *case* for one side — independent of judging it — forces engagement with that side's strongest arguments rather than waving them away.
- **The bias improvement is larger and more consistent than the reasoning improvement** on the strong model. This is the most architecturally interesting finding: a well-prompted single-pass agent can be coaxed into deep reasoning, but producing genuinely balanced treatment of both options is something the architectural pressure of "you must construct each case before synthesizing" reliably produces in a way that prompting alone often does not.

### What changes when the agent is weaker

The Qwen experiments show that the debate workflow's advantage **grows in absolute magnitude** but becomes **more polarized per scenario**:

- On scenarios where the weak agent's single-pass output is far below par (Buy house — financial reasoning the model struggles with; Accept promotion — where the easy answer is too tempting to engage the non-obvious case), the debate scaffold produces enormous gains (Cohen's d as high as 3.05).
- On the medium scenario where the model has a built-in template (Build vs SaaS), the debate doesn't add value either way.
- On the emotionally ambiguous scenario (Move to new city), the weak moderator introduces *bias* — sometimes producing strongly one-sided verdicts that the bias judge correctly penalizes — while the single-pass control hedges and stays balanced. This is a specific architectural failure mode: when the moderator is weak and the input has no anchor, the requirement to "render a verdict" can backfire.

The cleanest reading: **debate helps most where the underlying model lacks structure, hurts where the model can't be a reliable arbiter, and is neutral where the model already has a template.**

### Why we re-engineered the control to make it harder

An earlier iteration of these experiments showed pooled deltas roughly twice the current size. Investigation showed the original control agent's prompt was significantly less polished than the debate workflow's prompts — the experiment was partly testing prompt-engineering effort, not architecture. After rewriting the control with the same structural rigor (labeled Case-for-A / Case-for-B subsections, explicit Key Tensions, "what you give up" framing), the gap shrank but didn't close. This is a more honest test: with both workflows operating near the ceiling of their respective prompt designs, debate still wins. The remaining gap is concentrated on advice-bias, which we read as the architectural part of the advantage.

### When the debate format makes sense in production

- **High-stakes decisions** where the ~4× cost is acceptable.
- **Decisions involving emotional ambiguity** where a single-pass model is most prone to framing drift — assuming a *capable* moderator. (The Move-to-city Qwen failure is a warning.)
- **Decisions involving rich quantitative inputs** that benefit from being analyzed from each side's perspective in turn.
- **Decisions where one option is superficially obvious** but the user wants genuine engagement with the case for the other.

### When it doesn't

- Low-stakes everyday decisions — the latency and cost aren't worth it.
- Decisions in domains where the model has a strong built-in framework (e.g. classic engineering tradeoffs) — debate adds nothing.
- Decisions where the moderator's reliability is in question — particularly emotionally ambiguous decisions on a weak base model.

### Caveats

- **Hand-picked scenarios.** The 4-scenario set spans a designed difficulty spectrum but is not a random sample. Inference is valid within this set; generalization requires qualitative judgment.
- **Single judge throughout.** Both workflows always face the same judge, so the comparison is fair, but absolute score levels reflect that judge's calibration.
- **Two model classes is suggestive, not exhaustive.** "Debate helps weak models more" should be tested on at least one more open-weights model in a similar size class before being treated as a robust generalization.
- **Prompt-engineering ceiling not formally established.** Future control optimization could narrow the gap further; future debate-side optimization could widen it. The numbers here are point-in-time, not asymptotic.

## Experiment design history

The current setup is the result of iterative refinement:

- **Initial design:** 6 scenarios, 3 scorers (reasoning-depth, advice-bias, advice-relevancy), N=3 per agent.
- **Advice-relevancy removed:** Both agents scored at or near the ceiling (0.98–1.00) on every run, producing no signal.
- **Two scenarios removed:** One ill-formed medium scenario (high outlier rate) and a redundant easy scenario, leaving the current 4-scenario hard-qual / hard-quant / medium / easy spread.
- **Bias scorer redesigned:** The original bias scorer clustered both agents near the ceiling. Redesigned with 4 explicit dimensions and calibration anchors that put typical LLM advice in the 0.5–0.7 range. Pre/post-redesign scores are not comparable.
- **N increased from 3 → 5 → 10:** Cross-experiment pooling now provides N=24/26 per cell on gpt-5-mini and N=40 per cell on Qwen.
- **Control agent prompt rewritten (2026-04-16):** Rebuilt with explicit Case-for-A / Case-for-B / Key Tensions / What You Are Giving Up structure. Closed about half the reasoning-depth gap and a third of the bias gap. Original archived in `src/experiment-artifacts-history/`.
- **Moderator agent prompt rewritten (2026-04-17):** Rebuilt symmetrically with the same structural requirements. Restored the debate workflow's advantage to its current gpt-5-mini steady-state.
- **Cross-model migration (2026-04-25):** Workflow agents pointed at locally hosted `qwen/qwen3.5-2b` via LM Studio at `http://localhost:1234/v1`; LLM-judge scorers held on `openai/gpt-5-mini` to keep judging quality constant. Three same-config experiments at this configuration produced the N=160/160 Qwen pool.

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

To switch agent models, edit `src/mastra/model-config.ts`. The judges import `judgeModel` separately, so swapping `experimentModel` only affects the workflow agents.

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
    advice-scorers.ts       # Custom eval scorers (judges import judgeModel)
  evals/
    debate-eval.ts          # Dataset + experiment runner
  model-config.ts           # experimentModel (agents) + judgeModel (scorers)
  index.ts                  # Mastra instance
```

## Prerequisites

- Node.js 18+
- An `.env` file with `OPENAI_API_KEY` set (used by the judges, and by agents when `experimentModel` points at OpenAI).
- Optional: LM Studio running locally with `LMSTUDIO_BASE_URL` and `LMSTUDIO_MODEL_ID` in `.env` to point agents at a local model.
