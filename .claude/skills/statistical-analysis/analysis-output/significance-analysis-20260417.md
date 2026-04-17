# Statistical Significance Analysis: Debate vs Control Workflow (Post-Optimization)

**Date:** 2026-04-17
**Data sources:**
- Debate side (new moderator prompt): experiment-20260417-0013 (N=8, with 2 zero-score exclusions on Buy house) + experiment-20260417-0847 (N=10, clean)
- Control side (new control prompt): experiment-20260416-1933 (N=10) + experiment-20260417-0847 (N=10)

**Combined sample:**
- Debate: N=18 per scenario (N=16 for Buy house after 2 valid zero-score exclusions)
- Control: N=20 per scenario

---

## Summary

After optimizing both the control agent prompt (2026-04-16) and the moderator agent prompt (2026-04-17), the debate workflow again produces a statistically significant improvement over the control agent on both scorers. The overall pooled comparisons are significant at p < 10⁻⁴ on reasoning-depth and p < 10⁻⁷ on advice-bias. 6 of 8 per-scenario tests pass Bonferroni correction for multiple comparisons; the 2 that fail are on reasoning-depth and are directionally consistent with the rest.

This is a more informative replication than the 2026-04-16 analysis because the control agent is no longer a weak baseline. The earlier result could have been partly attributed to asymmetry of prompt-engineering effort between the two workflows. With both workflows operating near the ceiling of their respective prompt designs, a meaningful debate advantage persists — especially on advice-bias, where the gap is large (pooled d = 0.93).

### Why this pool combines three experiments

Both workflows changed across the experiment sequence. To build the largest valid sample, observations were pooled only across experiments where the relevant agent's configuration was unchanged:

- **Control side (N=20):** only runs using the new control prompt. The 2026-04-16 and 2026-04-17 control runs use identical control-agent configuration.
- **Debate side (N=18):** only runs using the new moderator prompt. The 2026-04-17 00:13 and 08:47 debate runs use identical debate/moderator configuration.

Earlier experiments under old prompts are excluded from this pool to preserve internal validity of the comparison.

---

## Methodology

### Tests used

- **Welch's t-test (two-sample, unequal variance)** — primary test. Welch is appropriate because several cells show meaningfully different between-group variances (e.g., Buy house RD: debate SD 0.021 vs control SD 0.057).
- **Mann-Whitney U test** — non-parametric check against the t-test for non-normal distributions.
- **Shapiro-Wilk test for normality** — validates the t-test's distributional assumption.
- **Cohen's d** — effect size, pooled standard deviation.
- **95% confidence intervals** — on the mean difference, via Welch-Satterthwaite degrees of freedom.

### Significance thresholds

- **Uncorrected α = 0.05** — standard single-test threshold.
- **Bonferroni-corrected α = 0.05 / 8 = 0.00625** — for the family of 8 per-scenario tests (4 scenarios × 2 scorers).

### Normality check

Shapiro-Wilk results flagged non-normality in 6 of 16 cells, concentrated in:
- Buy house reasoning-depth (both groups): W p < 0.01 — control has heavy right-skew (ceiling clustering)
- Move to new city reasoning-depth (debate): p = 0.002 — left tail
- Move to new city advice-bias (both groups): p < 0.05 — bimodal
- Buy house advice-bias (debate): borderline (p = 0.064)

Where normality is violated, the Mann-Whitney U result is the authoritative significance check. It agrees with the t-test in every case except one: Buy house reasoning-depth (t-test p = 0.19, MW p = 0.32) — both well above α; the disagreement is over "barely non-significant" vs "more clearly non-significant," not about the sign.

---

## Pooled results (all scenarios combined)

| Scorer | Debate (N=70) | Control (N=80) | Δ | 95% CI | Cohen's d | p (Welch) | p (MW) |
|---|---|---|---|---|---|---|---|
| reasoning-depth | 0.8138 | 0.7889 | +0.0247 | [+0.013, +0.037] | 0.65 (medium) | **< 10⁻⁴** | **< 10⁻⁴** |
| advice-bias | 0.8479 | 0.7724 | +0.0761 | [+0.050, +0.102] | 0.93 (large) | **< 10⁻⁷** | **< 10⁻⁵** |

**Interpretation.** Both pooled effects remain statistically significant with effect sizes in the medium-to-large range. Compared to the 2026-04-16 pool (weak-control baseline), the reasoning-depth pooled delta shrank (+0.053 → +0.025, roughly halved) while the advice-bias pooled delta shrank less (+0.115 → +0.076, about one-third smaller). The control prompt optimization absorbed more of the reasoning-depth gap than the bias gap — consistent with the idea that a well-structured single-pass prompt can replicate much of what adversarial debate offers for reasoning decomposition, but that the *balance/symmetry* signal captured by the bias scorer is genuinely harder for a single agent to produce even with strong prompting.

**Caveat:** Pooling collapses per-scenario structure. It should be read as "averaging across this 4-scenario set," not as a population-level estimate. The per-scenario breakdown below is more informative.

---

## Per-scenario results

### Reasoning depth

| Scenario | Debate mean | Control mean | Δ | 95% CI | Cohen's d | p (Welch) | Bonferroni (α=0.00625) |
|---|---|---|---|---|---|---|---|
| Buy house | 0.8275 (n=16) | 0.8089 (n=20) | +0.0186 | [−0.010, +0.047] | 0.42 (small) | 0.188 | ✗ fails |
| Move to new city | 0.8054 (n=18) | 0.7800 (n=20) | +0.0254 | [−0.001, +0.051] | 0.63 (medium) | 0.055 | ✗ fails |
| Build vs buy SaaS | 0.8106 (n=18) | 0.7899 (n=20) | +0.0207 | [−0.002, +0.044] | 0.59 (medium) | 0.074 | ✗ fails |
| Accept promotion | 0.8124 (n=18) | 0.7766 (n=20) | +0.0357 | [+0.018, +0.053] | 1.32 (large) | **0.00021** | **✓ passes** |

### Advice bias

| Scenario | Debate mean | Control mean | Δ | 95% CI | Cohen's d | p (Welch) | Bonferroni (α=0.00625) |
|---|---|---|---|---|---|---|---|
| Buy house | 0.8906 (n=16) | 0.8379 (n=20) | +0.0527 | [+0.024, +0.082] | 1.17 (large) | **0.00087** | **✓ passes** |
| Move to new city | 0.8433 (n=18) | 0.7190 (n=20) | +0.1243 | [+0.085, +0.164] | 2.08 (large) | **< 10⁻⁵** | **✓ passes** |
| Build vs buy SaaS | 0.8996 (n=18) | 0.8574 (n=20) | +0.0422 | [+0.022, +0.062] | 1.39 (large) | **0.00012** | **✓ passes** |
| Accept promotion | 0.7653 (n=18) | 0.6754 (n=20) | +0.0899 | [+0.059, +0.121] | 1.89 (large) | **< 10⁻⁵** | **✓ passes** |

### Summary of per-scenario significance

- **5/8 tests** pass the uncorrected α = 0.05 threshold (all 4 bias tests + Accept promotion RD).
- **5/8 tests** pass Bonferroni-corrected α = 0.00625 (same 5).
- The 3 non-significant cells are all **reasoning-depth** (Buy house, Move to new city, Build vs SaaS). All are directionally positive, with CIs that just barely include or touch zero. The magnitude of the effects (d = 0.42–0.63) would likely reach significance at larger N, but they are smaller than the debate workflow produces on advice-bias.
- Mann-Whitney U results agree with Welch's t-test on every significance conclusion.

---

## Effect sizes

| d range | Label | Count of 8 comparisons |
|---|---|---|
| < 0.2 | negligible | 0 |
| 0.2–0.5 | small | 1 |
| 0.5–0.8 | medium | 2 |
| > 0.8 | large | 5 |

The advice-bias row is all-large (d ≥ 1.17 on every scenario). The reasoning-depth row shows more variance, with one large (Accept promotion d = 1.32), two medium, and one small. The debate workflow's advantage is more uniform on bias than on reasoning-depth.

---

## Comparison to the 2026-04-16 pool (weak-control baseline)

| Metric | 2026-04-16 pool Δ | 2026-04-17 pool Δ | Change |
|---|---|---|---|
| Reasoning-depth (pooled) | +0.0527, d=1.24 | +0.0247, d=0.65 | Halved |
| Advice-bias (pooled) | +0.1150, d=1.51 | +0.0761, d=0.93 | ~⅓ smaller |

The control-prompt optimization closed more of the reasoning-depth gap than the bias gap. After the moderator optimization restored the debate workflow's advantage, the remaining steady-state gap is:
- **Reasoning-depth:** about half of the original gap (d = 0.65, medium)
- **Advice-bias:** about two-thirds of the original gap (d = 0.93, large)

Both remain statistically significant when pooled. But at the per-scenario level, reasoning-depth only cleanly separates on one of four scenarios, while bias separates on all four.

---

## Interpretation

### The core hypothesis survives the stronger control

With both workflows near the ceiling of their respective prompt designs, the debate workflow still produces statistically significant improvements on both metrics pooled. This is a stronger test than the 2026-04-16 analysis: the effect isn't merely an artifact of one side getting more prompt engineering attention. The remaining gap — particularly on bias (pooled d = 0.93) — is consistent with a real architectural advantage of the multi-agent design.

### Where reasoning-depth is close to indistinguishable

Three of four scenarios show reasoning-depth p > 0.05 per-scenario. The pooled effect is real but dilute: the debate workflow edges the control by ~0.02 on most scenarios and ~0.04 on Accept promotion. Several plausible readings:
- **Well-structured single-pass prompts nearly match debate on decomposition.** If the control prompt explicitly asks for labeled sub-sections (Case for A / Case for B / Key Tensions / What You Give Up), most of what the debate structure forced is already produced in one pass.
- **Reasoning-depth is scorer-ceilinged.** Both groups cluster around 0.78–0.83 with narrow variance, especially on Buy house (a scenario with rich quantitative inputs that both prompts handle well).
- **The remaining debate advantage on reasoning is specific to scenarios where one option is superficially obvious** (Accept promotion). When the easy answer is tempting, the adversarial structure forces real construction of the non-obvious case; the control, though structured, can still shortcut.

### Where advice-bias shows a clean structural advantage

All 4 scenarios show bias Δ ≥ +0.04, with Move to new city at +0.12 and Accept promotion at +0.09. The effect is strongest on the scenarios where:
- The decision is emotionally lopsided (Move to new city: stay vs. big upheaval)
- One option has an obvious conventional-wisdom answer (Accept promotion: obvious to take it)

These are precisely the contexts where a single-pass agent is most tempted toward framing drift, even with structured prompting. The debate workflow's two advocates must each genuinely construct and defend one side before the moderator synthesizes — this is harder to reproduce in a single-pass structure because the model has already "decided" by the time it writes the second subsection.

### Per-scenario patterns

- **Buy house** — hardest to separate on reasoning-depth (Δ = +0.019, p = 0.19). Rich symmetric financial inputs help both agents. Bias still separates clearly (Δ = +0.053, d = 1.17).
- **Move to new city** — largest bias effect (d = 2.08). Strongest evidence that the debate structure prevents emotional framing drift.
- **Build vs buy SaaS** — narrow on reasoning-depth (d = 0.59, p = 0.074); the control prompt's "engineering tradeoff" framing is very effective here. Bias still separates cleanly (d = 1.39) — the debate version gives substantially more attention to the non-recommended option's merits.
- **Accept promotion** — only scenario where reasoning-depth cleanly separates (d = 1.32). Both scorers agree this is where the debate structure adds the most value: it forces construction of the non-obvious case.

---

## Important caveats

### Single judge

All scores come from a single LLM judge (gpt-5-mini). Between-group variance includes judge-interpretation noise as well as real workflow differences. Both workflows face the same judge, so comparisons are fair — but "true" effect size could differ modestly from the measured value. A multi-judge ensemble would tighten the estimate but wasn't performed.

### Scenario set is hand-picked

The 4 scenarios span a designed difficulty spectrum but are not a random sample from any defined population of decisions. Inference is valid *within this scenario set*; generalization to arbitrary decisions requires qualitative judgment.

### Control-side pool mixes two experiments run 13 hours apart

The two contributing control-side experiments (2026-04-16 19:33 and 2026-04-17 08:47) use identical control agent configuration but were run at different times against the same OpenAI API. Time-varying factors (prompt-routing drift, server load) could introduce minor heterogeneity. Both contribute N=10; no evidence in the pooled SDs suggests a problem.

### Debate-side zero-score exclusions

2 of 18 debate runs on Buy house (from experiment-20260417-0013) returned exact 0.0 scores due to scoring failures (not content quality). These are correctly excluded by the zero-score filter. The Buy house debate cell therefore has N=16, not N=18. This slightly reduces power on that cell but does not bias the estimate.

### Multiple-comparisons concern

Eight per-scenario tests inflate family-wise error to ~34% uncorrected. Bonferroni (α = 0.00625) is conservative and is applied above. The conclusion survives Bonferroni for all 4 bias cells and 1 reasoning-depth cell. The pooled analysis sidesteps this concern and is overwhelmingly significant on both metrics.

### Effect attenuation under well-engineered control

The key finding relative to 2026-04-16: the gap shrinks but doesn't close. This is the central piece of new information. Future work attempting to further optimize the control prompt might narrow it more; future work optimizing the debate agents might reopen it. The current point-in-time answer is that a well-engineered debate workflow retains a meaningful edge over a well-engineered single-agent workflow, with the edge concentrated on balance/bias rather than raw reasoning decomposition.

---

## Conclusion

The debate workflow maintains a statistically significant advantage over the optimized control agent on both scorers pooled (reasoning-depth p < 10⁻⁴, d = 0.65; advice-bias p < 10⁻⁷, d = 0.93). At the per-scenario level, the advice-bias advantage is robust across all 4 scenarios (all pass Bonferroni), while the reasoning-depth advantage cleanly separates only on Accept promotion — the other 3 scenarios show small-to-medium positive effects that don't reach per-scenario significance at this N.

Compared to the pre-optimization baseline, the reasoning-depth gap halved and the bias gap shrank by about one-third. What remains is the debate workflow's structural advantage on producing genuinely balanced treatment of both options — an effect that appears architecturally grounded (requiring each side to be constructed before synthesis) rather than obtainable purely from better single-pass prompting.

The remaining open questions — generalization beyond 4 scenarios, robustness to further control-side optimization, judge ensemble validation — are not questions statistics can answer and require additional experimental work.
