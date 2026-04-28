# Qwen-via-LMStudio test runs — 2026-04-27

This file collects the small-N test runs done while migrating the experiment to a locally hosted Qwen model via LM Studio. These are pipeline-validation runs only, not part of any pooled analysis. Real N=10 experiments on the new setup will be saved to their own dated files.

---

## Run 1 — 2026-04-27 16:10 (N=1, all-Qwen smoke-test)

**Config:** 4 scenarios × 1 run × 2 agents = 4 debate + 4 control scored outputs.
**Zero-score exclusions:** none.
**Agent configuration:** **`qwen/qwen3.5-2b` via LM Studio** at `http://localhost:1234/v1`. All 6 LLM call sites (4 agents + 2 scorer judges) on the local Qwen model. **First experiment on a non-OpenAI model — not comparable to prior gpt-5-mini results.**

**Other config notes:**
- `itemTimeout` raised from 300s → 600s (Qwen-2B is slower per call than gpt-5-mini).
- `maxConcurrency` lowered from 3 → 1 (initial concurrent runs hit "Context size has been exceeded" errors from LM Studio under load; serial execution avoided this).
- `defaultOptions.modelSettings.maxOutputTokens = 2048` set on every agent to bound output and keep input+output within LM Studio's 16384 context window.

## Script output

```
=== Debate Workflow vs Control Agent Evaluation ===

4 scenarios, 2 scorers, 2 workflows, 1 runs each

Dataset "shoulder-agent-eval" — 4 items already match, no version bump.

--- Debate Workflow Experiments (1 runs) ---
  Run 1/1: 4/4 ok in 300.0s

--- Control Workflow Experiments (1 runs) ---
  Run 1/1: 4/4 ok in 44.6s

=== Comparison ===

--- "Buy a house now" ---
  [DEBATE]  RD 0.790 (0.790)   Bias 0.550 (0.550)
  [CONTROL] RD 0.790 (0.790)   Bias 0.550 (0.550)

--- "Move to a new city for a fresh start" ---
  [DEBATE]  RD 0.855 (0.855)   Bias 0.690 (0.690)
  [CONTROL] RD 0.855 (0.855)   Bias 0.780 (0.780)

--- "Build a custom internal tool" ---
  [DEBATE]  RD 0.855 (0.855)   Bias 0.780 (0.780)
  [CONTROL] RD 0.880 (0.880)   Bias 0.550 (0.550)

--- "Accept a promotion with a 40% raise and team lead role" ---
  [DEBATE]  RD 0.855 (0.855)   Bias 0.690 (0.690)
  [CONTROL] RD 0.855 (0.855)   Bias 0.550 (0.550)

=== Average Scores (debate: 4 runs, control: 4 runs) ===

Scorer                   Debate    Control   Delta
-------------------------------------------------------
reasoning-depth          0.839     0.845     -0.006
advice-bias              0.678     0.608     +0.070

Total time: 345.3s
```

## Per-scenario deltas (this run alone)

| Scenario | RD Δ | Bias Δ |
|---|---|---|
| Buy a house now (hard, quantitative) |  0.000 |  0.000 |
| Move to a new city (hard, qualitative) |  0.000 | −0.090 |
| Build custom tool (medium) | −0.025 | **+0.230** |
| Accept promotion (easy) |  0.000 | **+0.140** |

## Interpretation

This is **N=1** on a deliberately weaker model — virtually nothing here is statistically meaningful on its own. The point of this run is to (a) confirm the LMS pipeline works end-to-end, and (b) get a first directional read for the qwen3.5-2b configuration.

What the run *does* show:

- **Pipeline works.** All 8 scenarios completed without zero-score failures. The structured-output schema, the scorers, and the debate workflow all execute against Qwen.
- **Wall-clock asymmetry.** Debate runs took ~7× as long as control on this hardware (300s vs 45s for the same 4 scenarios). With 4 LLM calls per debate scenario (2 openings, 2 rebuttals, 1 moderator) vs 1 call per control scenario, this is roughly proportional. A full N=10 run will take approximately (300 + 45) × 10 ≈ ~58 minutes plus scoring overhead, vs ~10–20 min on gpt-5-mini.
- **Score range is much narrower than gpt-5-mini.** Reasoning-depth scores cluster tightly between 0.790 and 0.880; advice-bias hits exactly 0.550 in 5 of 8 cells. That tight clustering with repeated identical values strongly suggests the qwen-2b judge is producing repetitive structured-output values — the judge can only resolve a coarse number of distinct grades. This is the *judge-compression risk* I flagged in the migration plan.
- **Direction is mixed.** Across 4 scenarios at N=1, RD is flat or slightly negative on debate; Bias is positive on 2 scenarios, negative on 1, flat on 1. With N=1, this is consistent with both "no real effect" and "real effect ~half the magnitude of gpt-5-mini hidden by noise." The full N=10 will resolve which.

## Recommendations

1. **Proceed to a full N=10 qwen run.** The pipeline is healthy. Total wall-clock will be ~60 min plus scoring. The serial concurrency will keep this stable.
2. **Watch the score-range issue.** If the N=10 run shows the same coarse clustering (e.g. all bias values landing on 5–6 distinct grade values), that's evidence the qwen-2b judge can't discriminate finely enough to detect small effects. If that happens, a follow-up "agents on qwen, judges on gpt-5-mini" run (the variant we set aside in the plan) becomes valuable for separating "does the architecture help on a weak model?" from "can a weak judge detect the help?"
3. **Don't pool with gpt-5-mini results.** The model is the experiment variable, so qwen results form their own pool.

## Code state at end of run

- `RUNS_PER_AGENT` restored to 10.
- `maxConcurrency` left at 1 (revert to 3 if/when switching back to gpt-5-mini, since OpenAI handles concurrent requests fine).
- `itemTimeout` left at 600s.
- All 6 model sites + 4 agent `defaultOptions` blocks pointing at `experimentModel` from `src/mastra/model-config.ts`.

---

## Run 2 — 2026-04-27 17:xx (N=1, split-judge: Qwen agents + gpt-5-mini judges)

**Config:** 4 scenarios × 1 run × 2 agents = 4 debate + 4 control scored outputs.
**Zero-score exclusions:** none.
**Agent configuration:** `qwen/qwen3.5-2b` via LM Studio at `http://localhost:1234/v1` for the 4 workflow agents (debate-a, debate-b, control, moderator). **`openai/gpt-5-mini` for the 2 LLM-judge scorers** (reasoning-depth, advice-bias). This is the configuration we'll use for the real cross-model experiment — judging quality is held constant across the gpt-5-mini and Qwen agent runs.

**Why this change.** Run 1 (all-Qwen) showed the qwen-2b judge collapsing scores to a coarse set of repeated values (bias hit exactly 0.550 in 5 of 8 cells; RD spanned only [0.79, 0.88]). The judge couldn't discriminate finely enough to detect small effects. Splitting model-config so judges stay on gpt-5-mini eliminates that confound.

**Code change:** [src/mastra/model-config.ts](../../../../src/mastra/model-config.ts) now exports `experimentModel` (Qwen, used by agents) and `judgeModel` (gpt-5-mini, used by scorer judges); [src/mastra/scorers/advice-scorers.ts](../../../../src/mastra/scorers/advice-scorers.ts) imports `judgeModel`.

### Script output

```
=== Comparison ===

--- "Buy a house now" ---
  [DEBATE]  RD 0.438 (0.438)   Bias 0.300 (0.300)
  [CONTROL] RD 0.232 (0.232)   Bias 0.158 (0.158)

--- "Move to a new city for a fresh start" ---
  [DEBATE]  RD 0.712 (0.712)   Bias 0.720 (0.720)
  [CONTROL] RD 0.512 (0.512)   Bias 0.500 (0.500)

--- "Build a custom internal tool" ---
  [DEBATE]  RD 0.500 (0.500)   Bias 0.263 (0.263)
  [CONTROL] RD 0.463 (0.463)   Bias 0.275 (0.275)

--- "Accept a promotion with a 40% raise and team lead role" ---
  [DEBATE]  RD 0.512 (0.512)   Bias 0.550 (0.550)
  [CONTROL] RD 0.450 (0.450)   Bias 0.250 (0.250)

=== Average Scores (debate: 4 runs, control: 4 runs) ===

Scorer                   Debate    Control   Delta
-------------------------------------------------------
reasoning-depth          0.541     0.414     +0.126
advice-bias              0.458     0.296     +0.162

Total time: 478.4s
```

### Per-scenario deltas (this run alone)

| Scenario | Debate RD | Control RD | RD Δ | Debate Bias | Control Bias | Bias Δ |
|---|---|---|---|---|---|---|
| Buy a house now (hard, quantitative) | 0.438 | 0.232 | **+0.206** | 0.300 | 0.158 | +0.142 |
| Move to a new city (hard, qualitative) | 0.712 | 0.512 | **+0.200** | 0.720 | 0.500 | **+0.220** |
| Build a custom tool (medium) | 0.500 | 0.463 | +0.037 | 0.263 | 0.275 | −0.012 |
| Accept promotion (easy) | 0.512 | 0.450 | +0.062 | 0.550 | 0.250 | **+0.300** |

### Sanity-checks vs Run 1

- **Score range opened up.** RD spans [0.23, 0.71] now vs [0.79, 0.88] under Qwen-judge. Bias spans [0.16, 0.72] vs [0.55, 0.78]. The judge can finally discriminate.
- **Absolute scores are much lower than gpt-5-mini-on-gpt-5-mini results** (~0.81 RD, ~0.85 Bias pooled). This is exactly what we'd expect — the judge is now applying its calibrated high-bar standard to *Qwen-2b output*, which is genuinely lower-quality than gpt-5-mini output. The judge's calibration anchors say "typical LLM advice scores 0.5–0.7"; this Qwen control landed at 0.41 RD and 0.30 Bias, so the judge is reporting that Qwen's single-pass control output is below the typical-LLM bar. Plausible and informative.
- **Direction is consistent on N=1.** Debate beats control on RD in all 4 scenarios (Δ +0.04 to +0.21) and on Bias in 3 of 4 scenarios.
- **Wall-clock:** 478s total (~133s longer than Run 1's 345s, due to gpt-5-mini judge calls now being remote rather than local). Full N=10 should run in **roughly 70–80 minutes**.

### Recommendations

- Pipeline is healthy. Proceed to a full N=10 Qwen-with-gpt-5-mini-judges run.
- Don't pool with the gpt-5-mini-agents pool — different agent model is the experimental variable.
- Don't pool with Run 1 either — the judge difference is too large to combine.

### Code state at end of run

- `RUNS_PER_AGENT` restored to 10.
- `maxConcurrency: 1` retained (Qwen agent calls still go to LM Studio).
- `itemTimeout: 600s` retained.
- Agent sites use `experimentModel` (Qwen); scorer judges use `judgeModel` (gpt-5-mini).
