# Statistical Significance Analysis: Debate vs Control Workflow (Post-Optimization, 2026-04-24 Update)

**Date:** 2026-04-24
**Data sources:**
- Debate side (new moderator prompt): experiment-20260417-0013 (N=8, with 2 zero-score exclusions on Buy house) + experiment-20260417-0847 (N=10, clean) + experiment-20260424-1128 (N=2, clean demo)
- Control side (new control prompt): experiment-20260416-1933 (N=10) + experiment-20260417-0847 (N=10) + experiment-20260424-1128 (N=2 demo)

**Combined sample:**
- Debate: N=20 per scenario (N=18 for Buy house after 2 valid zero-score exclusions)
- Control: N=22 per scenario

**Reproducibility note:** This analysis was run twice end-to-end on the same source data (mastra.db SQL extracts). Both runs produced identical values to 4 decimal places on every cell (means, deltas, CIs, Cohen's d, p-values, Mann-Whitney U, Shapiro-Wilk). The numbers below are therefore confirmed stable, not transcription artifacts.

---

## Summary

After adding the 2026-04-24 N=2 demo run to the post-optimization pool, the conclusions from the 2026-04-17 analysis are reaffirmed and slightly strengthened. The debate workflow shows a statistically significant advantage over the optimized control on both pooled metrics:

- **reasoning-depth:** Δ = +0.026, d = 0.69, p ≈ 10⁻⁵
- **advice-bias:** Δ = +0.078, d = 0.97, p < 10⁻⁷

The bias advantage is large and survives Bonferroni on every per-scenario cell. The reasoning-depth advantage is medium-sized and only cleanly separates per-scenario on Accept promotion, with the other 3 scenarios directionally positive but underpowered at this N.

This is the third pooled snapshot (after 2026-04-16 weak-control and 2026-04-17 post-optimization) and the first to include data from three independent experiment sessions on each side.

---

## Methodology

### Tests used

- **Welch's t-test (two-sample, unequal variance)** — primary test. Welch is appropriate because several cells show meaningfully different between-group variances (e.g., Buy house RD: debate SD 0.020 vs control SD 0.055).
- **Mann-Whitney U test** — non-parametric check.
- **Shapiro-Wilk test for normality** — distributional assumption check for the t-test.
- **Cohen's d** — effect size, pooled SD.
- **95% confidence intervals** — Welch-Satterthwaite degrees of freedom.

### Significance thresholds

- **Uncorrected α = 0.05** — single-test threshold.
- **Bonferroni-corrected α = 0.05 / 8 = 0.00625** — for the family of 8 per-scenario tests (4 scenarios × 2 scorers).

### Normality check

Shapiro-Wilk p-values flagged non-normality in 5 of 16 cells (Buy house RD both groups, Move to new city RD debate, Move to new city Bias debate). These cells are concentrated where the underlying distribution is skewed by ceiling effects or bimodality. Where normality is violated, the Mann-Whitney U result is the authoritative significance check; it agrees with the t-test on every significance conclusion.

---

## Pooled results (all scenarios combined)

| Scorer | Debate (N=78) | Control (N=88) | Δ | 95% CI | Cohen's d | p (Welch) | p (MW) |
|---|---|---|---|---|---|---|---|
| reasoning-depth | 0.8151 | 0.7894 | **+0.0257** | [+0.0145, +0.0369] | 0.69 (medium) | **0.00001** | **0.00001** |
| advice-bias | 0.8497 | 0.7715 | **+0.0782** | [+0.0539, +0.1026] | 0.97 (large) | **< 10⁻⁷** | **< 10⁻⁷** |

---

## Per-scenario results

### Reasoning depth

| Scenario | Debate mean (SD) | Control mean (SD) | Δ | 95% CI | Cohen's d | p (Welch) | Bonferroni (α=0.00625) |
|---|---|---|---|---|---|---|---|
| Buy house | 0.8281 (n=18, SD 0.020) | 0.8061 (n=22, SD 0.055) | +0.0219 | [−0.004, +0.048] | 0.51 (medium) | 0.095 | ✗ fails |
| Move to new city | 0.8055 (n=20, SD 0.031) | 0.7797 (n=22, SD 0.045) | +0.0258 | [+0.002, +0.050] | 0.67 (medium) | 0.035 | ✗ fails |
| Build vs buy SaaS | 0.8134 (n=20, SD 0.032) | 0.7895 (n=22, SD 0.035) | +0.0238 | [+0.003, +0.045] | 0.70 (medium) | 0.028 | ✗ fails |
| Accept promotion | 0.8149 (n=20, SD 0.025) | 0.7824 (n=22, SD 0.034) | +0.0325 | [+0.014, +0.051] | 1.07 (large) | **0.00115** | **✓ passes** |

### Advice bias

| Scenario | Debate mean (SD) | Control mean (SD) | Δ | 95% CI | Cohen's d | p (Welch) | Bonferroni (α=0.00625) |
|---|---|---|---|---|---|---|---|
| Buy house | 0.8894 (n=18, SD 0.030) | 0.8374 (n=22, SD 0.051) | +0.0521 | [+0.026, +0.078] | 1.21 (large) | **0.00031** | **✓ passes** |
| Move to new city | 0.8434 (n=20, SD 0.063) | 0.7184 (n=22, SD 0.056) | +0.1250 | [+0.087, +0.163] | 2.09 (large) | **< 10⁻⁷** | **✓ passes** |
| Build vs buy SaaS | 0.8987 (n=20, SD 0.028) | 0.8559 (n=22, SD 0.032) | +0.0428 | [+0.024, +0.062] | 1.42 (large) | **0.00004** | **✓ passes** |
| Accept promotion | 0.7712 (n=20, SD 0.050) | 0.6742 (n=22, SD 0.046) | +0.0970 | [+0.067, +0.127] | 2.02 (large) | **< 10⁻⁵** | **✓ passes** |

### Summary of per-scenario significance

- **5/8 tests** pass uncorrected α = 0.05 (all 4 bias + Accept promotion RD).
- **5/8 tests** pass Bonferroni α = 0.00625 (same 5).
- The 3 non-significant cells are all reasoning-depth (Buy house, Move to new city, Build vs SaaS). All directionally positive with d = 0.51–0.70.
- Mann-Whitney U agrees with Welch on every significance conclusion.

---

## Effect sizes

| d range | Label | Count of 8 |
|---|---|---|
| < 0.2 | negligible | 0 |
| 0.2–0.5 | small | 0 |
| 0.5–0.8 | medium | 3 |
| > 0.8 | large | 5 |

The bias row is uniformly large (d ≥ 1.21 on every scenario). The reasoning-depth row spans medium-to-large.

---

## Comparison across the three pooled snapshots

| Snapshot | RD pooled Δ (d) | Bias pooled Δ (d) | Notes |
|---|---|---|---|
| 2026-04-16 (weak control, N=15 each) | +0.053 (1.24) | +0.115 (1.51) | Pre-optimization baseline. Inflated by control-side prompt asymmetry. |
| 2026-04-17 (post-opt, N=18/20) | +0.025 (0.65) | +0.076 (0.93) | After both control and moderator rewrites. Steady-state estimate. |
| 2026-04-24 (post-opt + N=2 demo, N=20/22) | +0.026 (0.69) | +0.078 (0.97) | Adds 2 runs per side. Numbers nearly identical to 04-17. |

The post-optimization estimates are stable across an additional 4 runs of new data: the deltas moved by ≤ 0.002 and Cohen's d by ≤ 0.04 on both metrics. This is consistent with the prior estimates being close to the steady-state for this configuration.

---

## Interpretation

### Stability of the post-optimization estimate

Adding 2 fresh runs per side did not move the headline numbers meaningfully. RD Δ went from +0.0247 → +0.0257 (≈4% relative change); Bias Δ went from +0.0761 → +0.0782 (≈3%). Cohen's d shifted by ≤ 0.04 on both metrics. This is the kind of stability you'd expect when the underlying effect is consistent and the prior estimate already had reasonable precision; it would not be the case if the prior estimate was inflated by run-level outliers.

### The bias advantage is robust; the reasoning-depth advantage is dilute but consistent

All 4 bias cells now pass Bonferroni at d ≥ 1.21, and the pooled effect (d = 0.97) is large. The bias advantage is the most architecturally robust finding in this experiment series.

For reasoning-depth, only Accept promotion separates per-cell at Bonferroni. The remaining 3 cells show d = 0.51–0.70 and uncorrected p in the 0.03–0.10 range. The direction is consistent across all 4 cells; the magnitude is just smaller than reliably detectable per-scenario at N=20–22. The pooled p < 10⁻⁴ rejects the null cleanly when treating the data as one comparison.

### The N=2 demo run's contribution

The 2 additional debate and 2 additional control runs from 2026-04-24 produced point estimates well within the prior pooled CI. They tightened CIs slightly (e.g., RD pooled CI half-width went from 0.012 to 0.011) but did not change any qualitative conclusion. This is what an unbiased low-N addition looks like — the central limit averages it in without distortion.

---

## Caveats

- **Single judge.** All scores come from gpt-5-mini. Both workflows face the same judge, so comparisons are fair, but the absolute numbers reflect that judge's biases.
- **Hand-picked scenarios.** The 4-scenario set is designed, not randomly sampled. Inference is valid within this set; generalization requires qualitative judgment.
- **Multiple-comparisons.** Bonferroni applied above. Pooled analysis sidesteps the concern.
- **Control pool now spans three sessions** (2026-04-16, 2026-04-17, 2026-04-24). Time-varying API behavior could introduce minor heterogeneity but no evidence in the SDs suggests a problem.

---

## Conclusion

Pooling three same-config experiments (N=78 debate vs N=88 control), the debate workflow retains a statistically significant advantage on both metrics: medium effect on reasoning-depth (Δ = +0.026, d = 0.69, p ≈ 10⁻⁵) and large effect on advice-bias (Δ = +0.078, d = 0.97, p < 10⁻⁷). All 4 bias cells pass Bonferroni; only Accept promotion does on reasoning-depth. The estimates are stable to within 4% of the 2026-04-17 snapshot, supporting that this is a steady-state characterization of the current configuration rather than a one-experiment artifact.
