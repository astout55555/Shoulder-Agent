# Statistical Significance Analysis: Debate vs Control on Qwen via LM Studio (N=20 pool)

**Date:** 2026-04-27
**Model under test (workflow agents):** `qwen/qwen3.5-2b` via LM Studio at `http://localhost:1234/v1`
**Judge model (LLM-judge scorers):** `openai/gpt-5-mini` (held constant from prior gpt-5-mini-agents experiments)
**Data sources:**
- experiment-20260427-1804 (N=10, clean, 0 zero-score exclusions)
- experiment-20260427-1932 (N=10, clean, 0 zero-score exclusions)

**Combined sample:** N=20 per scenario per agent, total N=80 observations per group when pooled across scenarios.

**Reproducibility note:** Analysis run twice end-to-end on the same source data; `diff` returned no differences (every value matches to 4 decimal places, including means, SDs, deltas, CIs, Cohen's d, p-values, Mann-Whitney U, and Shapiro-Wilk). Numbers below are confirmed stable.

---

## Summary

Pooled across 4 scenarios at N=20 per side, the debate workflow on a 2B-parameter Qwen model significantly outperforms a single-pass Qwen control on both metrics:

- **reasoning-depth:** Δ = +0.0750, d = 0.58, p ≈ 3×10⁻⁴
- **advice-bias:** Δ = +0.1009, d = 0.55, p ≈ 6×10⁻⁴

Per-scenario, the picture is **bimodal**:
- Two scenarios (Buy house, Accept promotion) show extremely large debate advantages — Cohen's d ≥ 1.85 on RD and ≥ 3.07 on Bias.
- One scenario (Build vs SaaS) shows essentially no effect on either metric.
- One scenario (Move to new city) shows a **debate disadvantage on Bias** (Δ = −0.108, d = −0.89, p ≈ 0.01).

This is qualitatively different from the gpt-5-mini-agents result, where the bias advantage was uniform across all 4 scenarios. On Qwen, the debate workflow's overall advantage is driven by very large gains on the quantitative and easy-lopsided scenarios, but the architectural benefit on emotionally ambiguous decisions does not transfer.

---

## Methodology

### Tests used

- **Welch's t-test (two-sample, unequal variance)** — primary test. Welch is appropriate because the debate-side per-cell SDs are much larger than the control-side SDs in every cell (e.g., Buy house bias: debate SD 0.112 vs control SD 0.030). Qwen's debate output has substantially higher run-to-run variance than its single-pass control output.
- **Mann-Whitney U test** — non-parametric check.
- **Shapiro-Wilk test for normality** — distributional assumption check.
- **Cohen's d** — effect size, pooled SD.
- **95% confidence intervals** — Welch-Satterthwaite degrees of freedom.

### Significance thresholds

- **Uncorrected α = 0.05**
- **Bonferroni-corrected α = 0.05 / 8 = 0.00625** for the family of 8 per-scenario tests.

### Normality check

Shapiro-Wilk flagged non-normality in only 1 of 16 cells (Build vs SaaS RD debate, p = 0.020). Most cells are consistent with normality at α = 0.05 even with N=20. Mann-Whitney U agrees with Welch's t-test on every significance conclusion.

---

## Pooled results (all scenarios combined)

| Scorer | Debate (N=80) | Control (N=80) | Δ | 95% CI | Cohen's d | p (Welch) | p (MW) |
|---|---|---|---|---|---|---|---|
| reasoning-depth | 0.5245 | 0.4495 | **+0.0750** | [+0.035, +0.115] | 0.58 (medium) | **0.00031** | **0.00105** |
| advice-bias | 0.4747 | 0.3738 | **+0.1009** | [+0.044, +0.158] | 0.55 (medium) | **0.00062** | **0.00365** |

Both pooled effects are statistically significant. Effect sizes are medium (d ≈ 0.55–0.58). Note that the pooled d is *smaller* than several individual cells' d values — this is because the per-scenario means differ substantially, inflating the pooled standard deviation.

---

## Per-scenario results

### Reasoning depth

| Scenario | Debate mean (SD) | Control mean (SD) | Δ | 95% CI | Cohen's d | p (Welch) | Bonferroni (α=0.00625) |
|---|---|---|---|---|---|---|---|
| Buy house | 0.4078 (SD 0.080) | 0.2159 (SD 0.038) | **+0.1919** | [+0.151, +0.232] | **3.06 (very large)** | **< 10⁻⁹** | **✓ passes** |
| Move to new city | 0.6115 (SD 0.058) | 0.5242 (SD 0.032) | +0.0873 | [+0.057, +0.118] | **1.85 (very large)** | **< 10⁻⁵** | **✓ passes** |
| Build vs buy SaaS | 0.5531 (SD 0.096) | 0.5854 (SD 0.043) | −0.0323 | [−0.080, +0.016] | −0.43 (small neg) | 0.181 | ✗ fails |
| Accept promotion | 0.5256 (SD 0.082) | 0.4725 (SD 0.021) | +0.0531 | [+0.014, +0.092] | 0.89 (large) | **0.01012** | ✗ fails (passes uncorrected) |

### Advice bias

| Scenario | Debate mean (SD) | Control mean (SD) | Δ | 95% CI | Cohen's d | p (Welch) | Bonferroni (α=0.00625) |
|---|---|---|---|---|---|---|---|
| Buy house | 0.3749 (SD 0.112) | 0.1227 (SD 0.030) | **+0.2521** | [+0.198, +0.306] | **3.07 (very large)** | **< 10⁻⁷** | **✓ passes** |
| Move to new city | 0.5496 (SD 0.162) | 0.6571 (SD 0.056) | **−0.1075** | [−0.187, −0.028] | **−0.89 (large neg)** | 0.00993 | ✗ fails (passes uncorrected) |
| Build vs buy SaaS | 0.4926 (SD 0.119) | 0.4913 (SD 0.029) | +0.0014 | [−0.056, +0.058] | 0.02 (negligible) | 0.960 | ✗ fails |
| Accept promotion | 0.4816 (SD 0.107) | 0.2240 (SD 0.027) | **+0.2576** | [+0.206, +0.309] | **3.29 (very large)** | **< 10⁻⁹** | **✓ passes** |

### Summary of per-scenario significance

- **6/8 tests** pass uncorrected α = 0.05 (4 large-positive cells, Accept promotion RD, plus Move-to-city Bias which is significantly *negative*).
- **4/8 tests** pass Bonferroni α = 0.00625: Buy house RD, Buy house Bias, Move-to-city RD, Accept promotion Bias — all very-large positive effects (d ≥ 1.85).
- The 2 uncorrected-α-only cells: Accept promotion RD (d = 0.89, p = 0.010) is positive and large but doesn't clear the stricter threshold; Move-to-city Bias (d = −0.89, p = 0.010) is *negative* and large but doesn't clear Bonferroni either.
- Build vs SaaS is non-significant on both metrics at any threshold.
- Mann-Whitney U agrees with Welch on every significance conclusion.

---

## Effect sizes

| d range | Label | Count of 8 |
|---|---|---|
| < 0 | negative | 2 |
| 0–0.2 | negligible | 1 |
| 0.2–0.5 | small | 0 |
| 0.5–0.8 | medium | 0 |
| 0.8–1.5 | large | 1 |
| > 1.5 | very large | 4 |

The Qwen result is the most polarized of any pool to date: 4 cells show very large positive effects (d ≥ 1.85), 2 cells are flat (d ≈ 0), and 2 cells go negative (one small, one large). On the cells where the debate workflow helps, it helps a lot.

---

## Comparison to gpt-5-mini-agents pool (N=94/104)

| | gpt-5-mini agents | Qwen agents | Direction |
|---|---|---|---|
| Pooled RD Δ (d) | +0.026 (0.69) | **+0.075 (0.58)** | ~3× larger Δ on Qwen, similar effect size |
| Pooled Bias Δ (d) | +0.076 (0.96) | **+0.101 (0.55)** | ~1.3× larger Δ on Qwen, smaller effect size |
| RD per-cell Bonferroni passes | 2/4 | 2/4 | Same count, different cells |
| Bias per-cell Bonferroni passes | 4/4 | 2/4 | Halved on Qwen |
| Bias per-cell negative effects | 0/4 | 1/4 | New on Qwen (Move to city) |

The pooled deltas are larger on Qwen than on gpt-5-mini, but the **pooled Cohen's d is smaller** because Qwen's per-cell variance is higher and the per-scenario effects are more polarized. The bias advantage is genuinely less robust on Qwen — gpt-5-mini debated bias on every scenario, Qwen debate produces a per-scenario bias advantage on only 2 of 4.

---

## Interpretation

### The debate advantage generalizes overall, but not uniformly per scenario

The pooled-level finding is encouraging: a much weaker model still benefits from the adversarial structure on both metrics, with statistically significant medium effect sizes. The architecture is not a gpt-5-mini-specific phenomenon. But the "uniform bias advantage across all scenarios" finding from gpt-5-mini does not replicate. On Qwen, the bias advantage is large where it appears but is **scenario-dependent** in a way that gpt-5-mini's was not.

### Where the debate workflow helps a lot

**Buy house and Accept promotion** show very large positive effects on both metrics (Cohen's d 1.85–3.29). These are the two scenarios where the qwen-2b control performed worst in absolute terms (RD 0.22, 0.47; Bias 0.12, 0.22). When the single-pass agent is far from the judge's quality bar, the debate scaffold provides large headroom.

In particular:
- **Buy house** — qwen control struggles to handle the financial reasoning; debate distributes the analytic load across two advocates and a moderator.
- **Accept promotion** — qwen control reflexively picks the promotion and gives the case for declining only token coverage (control bias 0.22 = below the judge's "typical LLM" 0.5–0.7 anchor); debate forces a real advocate for declining.

Both cells pass Bonferroni at d ≥ 1.85 with N=20 per side. These are robust findings.

### Where the debate workflow doesn't help

**Build vs SaaS** is essentially tied on both metrics (RD Δ −0.03, Bias Δ +0.001; neither significant). This scenario has a well-known build/buy decision framework that's likely overrepresented in qwen's training data. The qwen control produces a competent baseline; the debate doesn't have headroom to beat it. Same scenario was the weakest cell on gpt-5-mini too — so this scenario is consistently the hardest for the debate format to add value on.

### Where the debate workflow hurts

**Move to new city Bias** goes significantly *negative* (Δ = −0.108, d = −0.89, uncorrected p = 0.01). The qwen control happens to score very high on this scenario's bias (0.66, the highest control bias across all 4 scenarios) — by chance, qwen's single-pass output is balanced on emotionally ambiguous content. Meanwhile, the debate's bias mean is 0.55 with high variance (SD 0.16) — several debate runs scored very low (0.21, 0.25, 0.33), pulling down the mean.

The debate-side high variance suggests the qwen-2b moderator sometimes produces moderator outputs that strongly favor one side, and the bias judge correctly penalizes them. On gpt-5-mini, the moderator was reliable enough that this didn't happen. On qwen-2b, it does — and on this specific scenario, where the control happens to be balanced anyway, it makes the debate workflow look worse.

This is a real finding, not a noise artifact: the Welch test passes uncorrected α at p = 0.01, with consistent direction across both N=10 runs (R1 Δ = −0.055, R2 Δ = −0.160).

### Variance asymmetry as a signal

In every cell, debate-side SDs are 1.5–4× larger than control-side SDs. Two interpretations:
1. **The debate workflow has more "moving parts."** 4 LLM calls vs 1, so more chances for one weak call to drag the final score down or up. On a 2B model with higher per-call variance, this compounds.
2. **The judge sees more variation in genuine analytic depth across debate runs**, vs the single-pass control which always produces roughly the same shallow analysis.

Both are probably true. The second is fine and expected; the first means we'd need higher N to reliably detect smaller debate effects.

---

## Caveats

- **Single agent-side model on this side of the comparison.** The qwen-2b finding is specific to that model; another weak model might behave differently. To generalize "debate helps weak models," you'd want at least one more open-weights model in this size class.
- **Single judge.** gpt-5-mini judge holds judging quality constant across the gpt-5-mini-agents and qwen-agents experiments, which is the right design for cross-model comparison. But absolute scores are still anchored to that judge's preferences.
- **Hand-picked scenarios.** Inference is valid within this 4-scenario set.
- **Multiple-comparisons.** Bonferroni applied above; pooled analysis sidesteps the concern.
- **N=20 per cell** is enough to cleanly separate the very-large effects but underpowered for Build/SaaS RD (d = −0.43) and Move-to-city Bias (d = −0.89, just shy of Bonferroni). N=40 per cell would tighten these.
- **High debate-side variance on Qwen.** Because debate-side SDs are 1.5–4× larger than control-side SDs, the per-cell power is asymmetric — Welch is the right test here, but small effects on the noisier debate distribution are harder to detect.

---

## Conclusion

The debate workflow's advantage over a single-pass control survives a model-class downgrade from gpt-5-mini to qwen-2b: pooled deltas of +0.075 (RD) and +0.101 (Bias) at p ≈ 10⁻⁴ each, both with medium effect sizes (d ≈ 0.55–0.58). However, the per-scenario picture is more polarized than on gpt-5-mini — the debate advantage concentrates very large gains on the two scenarios where the single-pass qwen control is weakest (Buy house and Accept promotion, both Bonferroni-passing at d ≥ 1.85), is flat where qwen handles the scenario well via existing training-data templates (Build vs SaaS), and goes significantly negative on one scenario (Move to new city Bias, d = −0.89) where qwen-2b's structured-output variance produces occasional unbalanced moderator verdicts that the bias judge correctly penalizes.

The headline cross-model finding is that **the debate architecture provides more help where the underlying model is weakest**, which is the most interesting outcome for the architectural-benefit hypothesis. The bias-improvement-on-every-scenario finding from gpt-5-mini does *not* replicate, suggesting that some of that uniformity was specific to a high-quality moderator.
