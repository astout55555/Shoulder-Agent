# Statistical Significance Analysis: Debate vs Control Workflow (Post-Optimization, 2026-04-24 Update #2)

**Date:** 2026-04-24 (second analysis of the day; supersedes [significance-analysis-20260424.md](significance-analysis-20260424.md))
**Data sources:**
- Debate side (new moderator prompt): exp-20260417-0013 (N=8, with 2 zero-score exclusions on Buy house) + exp-20260417-0847 (N=10) + exp-20260424-1128 (N=2 demo) + exp-20260424-1956 (N=4)
- Control side (new control prompt): exp-20260416-1933 (N=10) + exp-20260417-0847 (N=10) + exp-20260424-1128 (N=2 demo) + exp-20260424-1956 (N=4)

**Combined sample:**
- Debate: N=24 per scenario (N=22 for Buy house after 2 valid zero-score exclusions)
- Control: N=26 per scenario

**Reproducibility note:** This analysis was run twice end-to-end on the same source data (`diff` of the two outputs returned no differences — every value matches to 4 decimal places, including means, SDs, deltas, CIs, Cohen's d, p-values, Mann-Whitney U, and Shapiro-Wilk). The numbers below are confirmed stable, not transcription artifacts. This is the second consecutive snapshot to verify identical reproduction.

---

## Summary

After adding the 2026-04-24 19:56 N=4 run to the post-optimization pool, the conclusions are reaffirmed and one additional reasoning-depth cell (Move to new city) crosses into Bonferroni significance. The debate workflow shows a statistically significant advantage on both pooled metrics:

- **reasoning-depth:** Δ = +0.026, d = 0.69, p < 10⁻⁵
- **advice-bias:** Δ = +0.076, d = 0.96, p < 10⁻⁹

The bias advantage is large and survives Bonferroni on every per-scenario cell (now with all 4 pooled bias cells at p ≤ 0.0002). The reasoning-depth advantage is medium-sized; 2 of 4 cells now pass Bonferroni (Accept promotion and Move to new city), with Build vs SaaS one tier of α away and Buy house remaining underpowered.

This is the fourth pooled snapshot in the post-optimization series and includes data from four independent experiment sessions on each side.

---

## Methodology

### Tests used

- **Welch's t-test (two-sample, unequal variance)** — primary test.
- **Mann-Whitney U test** — non-parametric check.
- **Shapiro-Wilk test for normality** — distributional assumption check.
- **Cohen's d** — effect size, pooled SD.
- **95% confidence intervals** — Welch-Satterthwaite degrees of freedom.

### Significance thresholds

- **Uncorrected α = 0.05**
- **Bonferroni-corrected α = 0.05 / 8 = 0.00625** for the family of 8 per-scenario tests.

### Normality check

Shapiro-Wilk flagged non-normality in 3 cells (Buy house RD control, Move to new city RD debate, Move to new city Bias debate). Where normality is violated, the Mann-Whitney U result is the authoritative significance check; it agrees with Welch on every conclusion.

---

## Pooled results (all scenarios combined)

| Scorer | Debate (N=94) | Control (N=104) | Δ | 95% CI | Cohen's d | p (Welch) | p (MW) |
|---|---|---|---|---|---|---|---|
| reasoning-depth | 0.8144 | 0.7884 | **+0.0260** | [+0.0156, +0.0364] | 0.69 (medium) | **< 10⁻⁵** | **< 10⁻⁵** |
| advice-bias | 0.8470 | 0.7707 | **+0.0763** | [+0.0542, +0.0984] | 0.96 (large) | **< 10⁻⁹** | **< 10⁻⁹** |

---

## Per-scenario results

### Reasoning depth

| Scenario | Debate mean (SD) | Control mean (SD) | Δ | 95% CI | Cohen's d | p (Welch) | Bonferroni (α=0.00625) |
|---|---|---|---|---|---|---|---|
| Buy house | 0.8239 (n=22, SD 0.024) | 0.8071 (n=26, SD 0.053) | +0.0167 | [−0.007, +0.040] | 0.40 (small) | 0.157 | ✗ fails |
| Move to new city | 0.8092 (n=24, SD 0.033) | 0.7765 (n=26, SD 0.043) | +0.0326 | [+0.011, +0.054] | 0.84 (large) | **0.00421** | **✓ passes** |
| Build vs buy SaaS | 0.8122 (n=24, SD 0.030) | 0.7883 (n=26, SD 0.035) | +0.0239 | [+0.005, +0.042] | 0.73 (medium) | 0.012 | ✗ fails |
| Accept promotion | 0.8132 (n=24, SD 0.032) | 0.7816 (n=26, SD 0.036) | +0.0316 | [+0.012, +0.051] | 0.93 (large) | **0.00190** | **✓ passes** |

### Advice bias

| Scenario | Debate mean (SD) | Control mean (SD) | Δ | 95% CI | Cohen's d | p (Welch) | Bonferroni (α=0.00625) |
|---|---|---|---|---|---|---|---|
| Buy house | 0.8848 (n=22, SD 0.031) | 0.8381 (n=26, SD 0.047) | +0.0467 | [+0.024, +0.070] | 1.15 (large) | **0.00017** | **✓ passes** |
| Move to new city | 0.8408 (n=24, SD 0.064) | 0.7151 (n=26, SD 0.055) | +0.1257 | [+0.092, +0.160] | 2.11 (large) | **< 10⁻⁷** | **✓ passes** |
| Build vs buy SaaS | 0.8977 (n=24, SD 0.027) | 0.8506 (n=26, SD 0.040) | +0.0471 | [+0.028, +0.066] | 1.38 (large) | **0.00001** | **✓ passes** |
| Accept promotion | 0.7679 (n=24, SD 0.050) | 0.6791 (n=26, SD 0.047) | +0.0888 | [+0.061, +0.117] | 1.82 (large) | **< 10⁻⁷** | **✓ passes** |

### Summary of per-scenario significance

- **6/8 tests** pass uncorrected α = 0.05.
- **6/8 tests** pass Bonferroni α = 0.00625 (all 4 bias + Move to new city RD + Accept promotion RD).
- The 2 non-Bonferroni cells are both reasoning-depth (Buy house, Build vs SaaS). Buy house is small effect (d = 0.40) and remains underpowered; Build vs SaaS is medium (d = 0.73) and passes uncorrected α = 0.05 (p = 0.012) but doesn't survive Bonferroni's stricter α = 0.00625.
- Mann-Whitney U agrees with Welch on every significance conclusion.

---

## Effect sizes

| d range | Label | Count of 8 |
|---|---|---|
| < 0.2 | negligible | 0 |
| 0.2–0.5 | small | 1 |
| 0.5–0.8 | medium | 1 |
| > 0.8 | large | 6 |

The bias row remains uniformly large (d ≥ 1.15 on every scenario). The reasoning-depth row spans small-to-large; adding the N=4 run pushed Move to new city up from d = 0.67 to d = 0.84 (now in the large range).

---

## Comparison across all four pooled snapshots

| Snapshot | RD pooled Δ (d) | Bias pooled Δ (d) | RD Bonferroni cells | Bias Bonferroni cells |
|---|---|---|---|---|
| 2026-04-16 (weak control, N=15 each) | +0.053 (1.24) | +0.115 (1.51) | 3/4 | 3/4 |
| 2026-04-17 (post-opt, N=18/20) | +0.025 (0.65) | +0.076 (0.93) | 1/4 | 4/4 |
| 2026-04-24 (post-opt + N=2 demo, N=20/22) | +0.026 (0.69) | +0.078 (0.97) | 1/4 | 4/4 |
| **2026-04-24 #2 (post-opt + N=2 + N=4, N=24/26)** | **+0.026 (0.69)** | **+0.076 (0.96)** | **2/4** | **4/4** |

The post-optimization pooled deltas have now been stable across three snapshots spanning +6 fresh debate runs and +6 fresh control runs: RD Δ moved by ≤ 0.001 and Bias Δ by ≤ 0.002. Pooled Cohen's d moved by ≤ 0.04 on both metrics. This is strong evidence that the current configuration's true effect is at or very near the measured numbers, not a sampling artifact.

The most informative change in this snapshot is per-cell rather than pooled: Move to new city RD crossed Bonferroni (was p = 0.035, now p = 0.0042 with d = 0.84). With N=24/26 the per-cell power is high enough to detect medium-large effects on individual scenarios; smaller effects (Buy house RD d = 0.40) still need more N.

---

## Interpretation

### Stability is now well-established

Three consecutive snapshots after the agent prompt rewrites have produced essentially identical pooled estimates (RD Δ within 0.001, Bias Δ within 0.002). The pre-optimization → post-optimization transition is a genuine shift; subsequent run-to-run variation is noise around a stable steady state.

### Per-scenario picture is sharpening

With N=94 vs N=104 pooled:
- All 4 bias cells pass Bonferroni at large effect sizes (d = 1.15–2.11).
- 2 of 4 reasoning-depth cells now pass Bonferroni (d = 0.84 and 0.93).
- Build vs SaaS RD is at p = 0.012 with d = 0.73 — a real medium effect that probably needs another ~10–20 runs per side to clear the corrected threshold.
- Buy house RD remains at d = 0.40 and is the only cell where the underlying effect may genuinely be too small to separate cleanly. The control's high-variance ceiling clustering on this scenario (SD 0.053 vs debate's 0.024) is the dominant source of uncertainty.

### What the new N=4 contributed

The N=4 run's per-scenario averages (RD: −0.008, +0.068, +0.025, +0.028; Bias: +0.022, +0.131, +0.071, +0.045) are within run-to-run noise of the pooled means. Buy house RD's negative single-run delta (−0.008) is not informative on its own — it's a known high-variance cell. The most useful contribution of this run was the Move to new city RD points (debate 0.787, 0.887, 0.813, 0.823 vs control 0.775, 0.787, 0.763, 0.712), which tightened the SDs and helped that cell cross Bonferroni.

---

## Caveats

- **Single judge** (gpt-5-mini). Both workflows face the same judge.
- **Hand-picked scenarios.** Inference is valid within this 4-scenario set.
- **Multiple-comparisons.** Bonferroni applied above; pooled analysis sidesteps the concern.
- **Control pool now spans four sessions** (2026-04-16, 2026-04-17, 2026-04-24 11:28, 2026-04-24 19:56). Heterogeneity could in principle inflate variance, but observed within-cell SDs are consistent with prior snapshots.

---

## Conclusion

Pooling four same-config experiments (N=94 debate vs N=104 control), the debate workflow's advantage is statistically significant on both metrics: medium effect on reasoning-depth (Δ = +0.026, d = 0.69, p < 10⁻⁵) and large effect on advice-bias (Δ = +0.076, d = 0.96, p < 10⁻⁹). All 4 bias cells and 2 of 4 reasoning-depth cells pass Bonferroni. The estimates are now stable to within ≤ 0.002 (Δ) and ≤ 0.04 (d) across three consecutive post-optimization snapshots, supporting that this is the configuration's true steady-state advantage rather than a single-experiment artifact. The two-run reproducibility check returned a zero diff.
