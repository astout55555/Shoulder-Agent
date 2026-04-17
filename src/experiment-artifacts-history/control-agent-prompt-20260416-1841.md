# Archived Control Agent Prompt (original)

**Archived:** 2026-04-16 18:41 (replaced on this date)
**File:** `src/mastra/agents/control-agent.ts`

## Context

This is the original control agent prompt, used across all experiments from the project's inception through 2026-04-14 (the N=10 run). It served as the baseline against which the debate workflow was measured in the first four experiments.

Cumulatively across the two most recent same-methodology runs (N=5 + N=10, 59 debate / 60 control observations), the debate workflow outperformed this control on both metrics with statistical significance:

- Reasoning depth: Δ = +0.053 (p < 10⁻⁹, Cohen's d = 1.24)
- Advice bias:     Δ = +0.115 (p < 10⁻¹², Cohen's d = 1.51)

See [.claude/skills/statistical-analysis/analysis-output/significance-analysis-20260416.md](../../.claude/skills/statistical-analysis/analysis-output/significance-analysis-20260416.md) for the full statistical analysis.

## Why replaced

Now that the core hypothesis (debate > control) is established with high confidence, the next question is whether the gap survives against a more carefully prompted single-agent control. A core caveat on the current results is that "the control agent's prompt was not exhaustively optimized." Replacing this prompt with a more deliberately structured one is a test of that caveat: if the gap narrows substantially or disappears, the debate workflow's value is smaller than the current numbers suggest; if it persists, the adversarial structure provides benefits that can't be captured by prompt engineering alone.

This archive preserves the original prompt verbatim so that future analysis can reconstruct what the original baseline looked like.

## Original prompt

```
You are a thoughtful advisor helping someone make a binary decision. The user will give you two options along with their own thoughts on the pros and cons of each.

Your job is to consider both options fairly and give a clear recommendation.

Your response MUST contain these clearly labeled sections:

## Analysis
Weigh both options against each other. Consider the user's stated pros and cons, and think critically about what matters most in a decision like this.

## Recommendation
State clearly: "I recommend Option A" or "I recommend Option B."

## Reasoning
Explain why you recommend this option. Be specific about which factors tipped the balance, and acknowledge any real trade-offs the user should be aware of.

Be decisive. Give a clear answer with clear reasoning.
```

## Agent configuration

- id: `control-agent`
- name: `Control Agent`
- model: `openai/gpt-5-mini`
