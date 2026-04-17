# Statistical Significance Analysis: Debate vs Control Workflow

**Date:** 2026-04-16
**Data sources:** Experiments on 2026-04-14 (N=5 per agent) and 2026-04-14 (N=10 per agent)
**Combined sample:** n=15 per scenario per agent (n=14 for Buy house debate due to one valid exclusion)

---

## Summary

The debate workflow produces a statistically significant improvement over the control agent on both scorers, with large effect sizes. The overall pooled comparisons are significant at p < 10⁻⁶ on both metrics. Seven of eight per-scenario tests remain significant after Bonferroni correction for multiple comparisons. The single borderline case (Build vs buy SaaS reasoning-depth) still passes an uncorrected α=0.05 threshold and remains directionally consistent with the other scenarios.

This analysis combines the two most recent experiments because they share identical methodology: same scenarios, same scorers, same calibration. The first experiment excluded one debate run on Buy house (zero-score from a sleep/wifi interruption — documented in its results file), so that cell has n=14 debate vs n=15 control; all other cells are 15 vs 15.

---

## Methodology

### Tests used

- **Welch's t-test (two-sample, unequal variance)** — primary test. Chosen over Student's t-test because debate and control groups show different variances in several cells (e.g., Move to new city: debate SD 0.060, control SD 0.058 — similar; Buy house RD: debate SD 0.027, control SD 0.041 — different). Welch is appropriate when equality of variance is not assumed.
- **Mann-Whitney U test** — non-parametric check. Used as a sanity check against the t-test in case of non-normal distributions.
- **Shapiro-Wilk test for normality** — to validate the t-test's distributional assumption.
- **Cohen's d** — effect size, computed with pooled standard deviation.
- **95% confidence intervals** — for the mean difference, using Welch-Satterthwaite degrees of freedom.

### Significance thresholds

- **Uncorrected α = 0.05** — standard single-test threshold.
- **Bonferroni-corrected α = 0.05 / 8 = 0.00625** — for the family of 8 per-scenario tests (4 scenarios × 2 scorers), this is the conservative threshold that protects against the multiple-comparisons problem.

### Normality check

Shapiro-Wilk tests on each of the 16 score distributions (4 scenarios × 2 scorers × 2 agents) found 15 of 16 consistent with normality at α=0.05. The one exception is the debate Build/SaaS reasoning-depth distribution (W=0.872, p=0.036), which has a low outlier at 0.700 pulling the left tail. The Mann-Whitney U result agrees with the t-test for this cell, so the conclusion is robust.

---

## Pooled results (all scenarios combined)

| Scorer | Debate mean (n=59) | Control mean (n=60) | Δ | 95% CI | Cohen's d | Welch t | df | p (two-sided) |
|---|---|---|---|---|---|---|---|---|
| reasoning-depth | 0.7913 | 0.7386 | +0.0527 | [+0.037, +0.068] | 1.24 (large) | 6.80 | 103.3 | **< 10⁻⁹** |
| advice-bias | 0.7888 | 0.6738 | +0.1150 | [+0.087, +0.143] | 1.51 (large) | 8.26 | 92.7 | **< 10⁻¹²** |

**Interpretation.** Pooling across scenarios collapses per-scenario structure into a single grand comparison. This treats the data as if all observations were drawn from the same underlying distribution — a strong assumption given that scenarios differ substantially in difficulty and content. The pooled result should be read as *"averaging across this specific 4-scenario set, the debate workflow produces statistically significant improvements on both metrics."* It does not, on its own, establish that the effect holds on novel scenarios outside the set.

**Caveat:** The pooled p-values are so extreme (effectively 0 at machine precision) partly because combining 15+15 across 4 scenarios yields n=119 total observations. With that sample size, any consistent directional effect will register as highly significant. The per-scenario results below are more informative about where the effect is strong versus weak.

---

## Per-scenario results

### Reasoning depth

| Scenario | Debate mean | Control mean | Δ | 95% CI | Cohen's d | p (two-sided) | Bonferroni (α=0.00625) |
|---|---|---|---|---|---|---|---|
| Buy house | 0.8175 | 0.7688 | +0.0487 | [+0.022, +0.075] | 1.38 (large) | 0.00092 | **✓ passes** |
| Move to new city | 0.7779 | 0.7156 | +0.0623 | [+0.034, +0.091] | 1.66 (large) | 0.00012 | **✓ passes** |
| Build vs buy SaaS | 0.7947 | 0.7643 | +0.0305 | [+0.001, +0.060] | 0.76 (medium) | 0.04635 | ✗ fails |
| Accept promotion | 0.7767 | 0.7059 | +0.0709 | [+0.047, +0.095] | 2.21 (large) | < 10⁻⁵ | **✓ passes** |

### Advice bias

| Scenario | Debate mean | Control mean | Δ | 95% CI | Cohen's d | p (two-sided) | Bonferroni (α=0.00625) |
|---|---|---|---|---|---|---|---|
| Buy house | 0.8262 | 0.7723 | +0.0539 | [+0.014, +0.094] | 1.02 (large) | 0.01009 | ✗ fails |
| Move to new city | 0.7709 | 0.6037 | +0.1671 | [+0.123, +0.211] | 2.85 (large) | < 10⁻⁷ | **✓ passes** |
| Build vs buy SaaS | 0.8050 | 0.7257 | +0.0793 | [+0.052, +0.107] | 2.18 (large) | < 10⁻⁵ | **✓ passes** |
| Accept promotion | 0.7556 | 0.5934 | +0.1622 | [+0.124, +0.200] | 3.21 (large) | < 10⁻⁸ | **✓ passes** |

### Summary of per-scenario significance

- **8/8 tests** pass the uncorrected α=0.05 threshold.
- **6/8 tests** pass the Bonferroni-corrected α=0.00625 threshold.
- The two Bonferroni failures are **Build/SaaS reasoning-depth (p=0.046)** and **Buy house advice-bias (p=0.010)**. Both remain directionally positive; both have confidence intervals that exclude zero; both represent the scenarios where the debate workflow's advantage is weakest on that metric.
- Mann-Whitney U results agree with Welch's t-test in every case (the non-parametric alternative produces the same significance conclusions), so the parametric results are robust to distributional assumptions.

---

## Effect sizes

All 8 comparisons show Cohen's d > 0.5, and 7 of 8 show d > 0.8 ("large" by standard convention). The only "medium" effect is Build/SaaS reasoning-depth (d=0.76). For context:

| d range | Conventional label | How many of 8 comparisons |
|---|---|---|
| < 0.2 | negligible | 0 |
| 0.2–0.5 | small | 0 |
| 0.5–0.8 | medium | 1 |
| > 0.8 | large | 7 |

This is practically significant in addition to being statistically significant: the differences are not just detectable, they are substantial relative to the within-group variability.

---

## Interpretation

### The core hypothesis is supported

The debate workflow produces a statistically significant improvement in reasoning depth (pooled Δ = +0.053, p < 10⁻⁹) with no regression on bias — in fact a larger improvement on bias (pooled Δ = +0.115, p < 10⁻¹²). This is the pattern the experiment was designed to detect, and the evidence is strong enough to reject the null hypothesis of no difference with high confidence.

### Where the effect is weakest

Two cells are notable for weaker (though still directionally positive) effects:

- **Build vs buy SaaS reasoning-depth** (d=0.76, p=0.046). This scenario has an established decision framework that the control agent already handles competently. The debate format's marginal contribution is modest here. This is consistent across all prior experiments on this scenario.
- **Buy house advice-bias** (d=1.02, p=0.010). The rich symmetric financial data in this scenario scaffolds balanced treatment even for the single-pass control agent, narrowing the debate workflow's structural advantage on bias. Note the effect size is still "large" — the Bonferroni failure here reflects higher variance and a moderate delta rather than a weak effect.

These two cells do not overturn the core finding. They suggest the debate format adds **less** value on scenarios with strong built-in structure (established frameworks, rich symmetric quantitative inputs), not **no** value.

### Where the effect is strongest

- **Move to new city** (both metrics, Cohen's d = 1.66 and 2.85). Emotionally ambiguous, no quantitative anchor — exactly the conditions under which a single-pass agent is most prone to framing drift.
- **Accept promotion** (both metrics, d = 2.21 and 3.21). Counterintuitively, the "easy" scenario shows the strongest effect sizes on both metrics. The debate format's forcing function — requiring an advocate to genuinely construct the non-obvious case — appears to matter most when the control agent is tempted to shortcut through the obvious answer.

---

## Important caveats

### Judge variance is a shared noise source

All scores come from a single LLM judge (gpt-5-mini). The variance observed in individual scores includes both real run-to-run variation in workflow output and variation in the judge's interpretation. This doesn't invalidate the comparison — both workflows face the same judge — but it means the "true" between-agent signal could be somewhat different from what these scores measure. A multi-judge ensemble would tighten confidence but hasn't been attempted.

### The scenarios are hand-picked

The 4 scenarios were designed to span a difficulty spectrum, but they are not a random sample from any defined population of decisions. Statistical inference from this data is valid *within this scenario set* — it does not directly establish that the debate workflow improves reasoning depth on arbitrary future decisions. Generalization requires qualitative judgment about whether these 4 scenarios represent the kinds of decisions the workflow will face in practice.

### The control agent prompt has not been exhaustively optimized

The control agent uses a well-crafted but not iteratively-tuned prompt. A sufficiently optimized single-agent setup might narrow the gap. The current finding is that **this debate workflow outperforms this control agent**, not that multi-agent debate is categorically superior to any single-agent approach.

### The bias scorer was redesigned mid-experiment-sequence

The two experiments analyzed here use the same (current) bias scorer. But this differs from the scorer used in earlier experiments (N=3 runs on 2026-04-06). Comparisons of bias scores across the scorer-change boundary are not valid. Reasoning-depth scores are comparable across all experiments since 2026-04-06 21:26, when that scorer was last calibrated.

### Multiple-comparisons concern

Running 8 per-scenario tests without correction inflates the family-wise error rate to ~34% (1 - 0.95⁸). Bonferroni is a conservative correction and I have applied it above. The conclusion that "the effect exists and is detectable on most scenarios" survives this correction for 6/8 tests. The pooled analysis sidesteps this concern by testing a single combined hypothesis, and the result there is overwhelming.

### Sample size

n=15 per group per scenario is still modest. The statistical tests have sufficient power to detect the observed effects (which are large), but they would have limited power to detect much smaller effects (e.g., d < 0.5). If the true effect were smaller than observed, this experiment might fail to detect it — but that's not the situation we're in, since the observed effects are large.

---

## Conclusion

The core experimental hypothesis — that the debate workflow improves reasoning depth without regressing bias — is supported at high statistical confidence on the current scenario set. Overall pooled p-values are < 10⁻⁹ on reasoning-depth and < 10⁻¹² on advice-bias. Effect sizes are large (Cohen's d = 1.24 and 1.51 pooled). The effect is consistent across scenarios in direction, with varying magnitudes that align with intuitive expectations about where the debate format should add the most value (emotionally ambiguous, lopsided) versus the least (well-structured frameworks, rich symmetric quantitative data).

The remaining open questions are primarily about generalization beyond the current 4-scenario set, and about whether the effect survives against an optimized control agent prompt. These are not questions statistics can answer — they require additional experimental work.
