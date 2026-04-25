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

After iterative prompt-engineering on both workflows, the debate workflow retains a statistically significant advantage over a well-optimized control agent. The current headline numbers pool three same-methodology experiments where the relevant agent configuration was held fixed: **N=20 debate runs per scenario (N=18 on Buy house after 2 valid zero-score exclusions) and N=22 control runs per scenario**.

| Metric | Debate (N=78) | Control (N=88) | Δ | 95% CI | Cohen's d | p-value |
|---|---|---|---|---|---|---|
| reasoning-depth | 0.815 | 0.789 | **+0.026** | [+0.014, +0.037] | 0.69 (medium) | **0.00001** |
| advice-bias | 0.850 | 0.772 | **+0.078** | [+0.054, +0.103] | 0.97 (large) | **< 10⁻⁷** |

Both pooled effects remain statistically significant. The advice-bias advantage is large and robust across every scenario; the reasoning-depth advantage is medium-sized and cleanly separates per-scenario on only one of four cells. The estimate has been re-run end-to-end on the same source data and reproduces to 4 decimal places. See [significance-analysis-20260424.md](.claude/skills/statistical-analysis/analysis-output/significance-analysis-20260424.md) for the full analysis.

**Per-scenario breakdown (pooled, post-optimization):**

| Scenario | Difficulty | RD Δ | Bias Δ | RD p-value | Bias p-value |
|---|---|---|---|---|---|
| Buy house vs. rent | Hard, quantitative | +0.022 | +0.052 | 0.095 | 0.00031 ✓ |
| Move to new city vs. stay | Hard, qualitative | +0.026 | **+0.125** | 0.035 | < 10⁻⁷ ✓ |
| Build custom tool vs. buy SaaS | Medium | +0.024 | +0.043 | 0.028 | 0.00004 ✓ |
| Accept promotion vs. decline | Easy | **+0.033** | +0.097 | 0.00115 ✓ | < 10⁻⁵ ✓ |

✓ = passes Bonferroni-corrected threshold (α = 0.00625 for 8 tests). All 4 bias cells pass Bonferroni. Only Accept promotion cleanly separates on reasoning-depth; the other 3 reasoning-depth cells are directionally positive (d = 0.51–0.70) with uncorrected p in the 0.03–0.10 range — directionally consistent but underpowered at this N for per-cell separation.

**What changed from the pre-optimization baseline.** An earlier analysis (N=15 per group, weak control prompt) showed pooled deltas of +0.053 (RD) and +0.115 (Bias). After rewriting the control agent's prompt with explicit structure comparable to the debate output, the reasoning-depth gap halved and the bias gap shrank by about a third. A follow-up rewrite of the moderator agent's prompt restored the debate workflow's advantage to the numbers above — meaningfully smaller than the pre-optimization gap, but still statistically significant. The remaining gap is concentrated on balance/bias rather than raw reasoning decomposition.

**Stable results.** The post-optimization pooled estimate has been computed twice with identical results, to confirm there isn't mistaken variation in the statistical analysis with the same results.

**Remaining caveats:**

- Results are formally significant within this 4-scenario set; generalization to novel scenarios requires qualitative judgment about whether the scenarios are representative of real decisions.
- Further control-side optimization might narrow the gap further; further debate-side optimization might widen it. The current numbers are a point-in-time answer, not a final one.
- All scores come from a single LLM judge (gpt-5-mini). Both workflows face the same judge, so the comparison is valid, but the scores themselves reflect that judge's biases and variance.

### Key observations

- **The effect survives a well-engineered control.** The earlier +0.053 / +0.115 result could have been partly an artifact of one workflow getting more prompt-engineering attention than the other. With both workflows now operating near the ceiling of their respective prompt designs, pooled deltas of +0.026 (RD) and +0.078 (Bias) remain statistically significant — a stronger test than the pre-optimization baseline.

- **The bias advantage looks architectural; the reasoning-depth advantage shrinks under a structured control prompt.** All 4 scenarios pass Bonferroni on bias (Cohen's d = 1.21–2.09). Only Accept promotion passes on reasoning-depth (d = 1.07); the other 3 reasoning-depth cells show medium positive effects (d = 0.51–0.70). This pattern suggests that a well-structured single-pass prompt can largely reproduce the debate workflow's reasoning decomposition, but that producing genuinely balanced treatment of both options is harder without an adversarial structure that constructs each case before synthesis.

- **The debate format still adds the most value on easy, lopsided scenarios.** Accept promotion shows the highest reasoning-depth delta (+0.033) and a large bias delta (+0.097). When one option is obviously stronger, a single-pass agent tends to shortcut genuine construction of the opposing case. The debate format forces the assigned advocate to build real arguments for the non-obvious side.

- **Emotionally ambiguous scenarios show the largest bias advantage.** "Move to new city" has the largest bias delta in every experiment (post-optimization +0.125, d = 2.09). Without an adversarial structure, a single-pass agent drifts toward whichever emotional framing it gravitates to first — even with strong prompting.

- **Quantitative inputs reduce the bias advantage.** Buy house vs. rent shows the smallest bias delta (+0.052). When both options have concrete numbers attached, even the control agent produces symmetric engagement. The debate format's bias benefit is smaller when the raw inputs already scaffold balance.

- **The debate format costs ~3–4× more tokens and takes significantly longer.** For low-stakes decisions, the added reasoning depth is probably not worth it. The format makes most sense for decisions where balance/bias matters as much as or more than raw reasoning decomposition.

### Experiment design history

The current structure is the result of iterative refinement across several runs:

- **Initial design:** 6 scenarios, 3 scorers (reasoning-depth, advice-bias, advice-relevancy), N=3 per agent.
- **Advice-relevancy removed:** Both agents scored at or near the ceiling (0.98–1.00) on every run, producing no discriminating signal. Removed after the first two experiments.
- **Two scenarios removed:** One "medium" difficulty scenario was removed because it was an outlier with variable results, indicating that the scenario was probably not well-formed. It was also redundant with the other "medium" scenario. The less simple of the two "easy" scenarios was also removed, leaving only 2 hard scenarios (1 quantitative, 1 qualitative), 1 medium, and 1 easy.
- **Bias scorer redesigned:** The original bias scorer clustered both agents near the ceiling (debate ~0.97, control ~0.92), making separation difficult to interpret. Redesigned with 4 explicit dimensions and calibration anchors that push typical LLM advice into the 0.5–0.7 range. Scores from before and after this change are not directly comparable.
- **N increased from 3 → 5 → 10:** Early runs had wide enough per-scenario variance to obscure the signal. Per-experiment N=10 with cross-experiment pooling now provides N=18–20 per group per scenario.
- **Control agent prompt rewritten (2026-04-16):** The control prompt was rebuilt with explicit structure — labeled Case for A / Case for B subsections, Key Tensions, What You Are Giving Up — to match the rigor that had been applied to the debate-side agents. Closed about half the reasoning-depth gap and a third of the bias gap. Archived original in `src/experiment-artifacts-history/`.
- **Moderator agent prompt rewritten (2026-04-17):** The moderator prompt was rebuilt symmetrically with the same structural requirements. Restored the debate workflow's advantage to its current steady-state levels (+0.025 RD, +0.076 Bias pooled). Archived original in `src/experiment-artifacts-history/`.

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
