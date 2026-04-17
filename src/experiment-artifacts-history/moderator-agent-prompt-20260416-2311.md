# Archived Moderator Agent Prompt (original)

**Archived:** 2026-04-16 23:11 (replaced on this date)
**File:** `src/mastra/agents/moderator-agent.ts`

## Context

This is the original moderator agent prompt, used across all experiments from the project's inception through the 2026-04-16 experiment (the first run with the rewritten control agent prompt). It served as the third and final agent in the debate workflow, receiving the full decision context plus the debate transcript (opening arguments + rebuttals from both sides) and producing the structured verdict that is ultimately scored.

## Why replaced

In the 2026-04-16 19:33 experiment, the rewritten control agent prompt completely closed the previously-significant gap between the control and debate workflows:

- reasoning-depth Δ = −0.005 (control slightly higher)
- advice-bias Δ = −0.003 (control slightly higher)

Compare to the prior N=10 experiment (old control prompt), where the debate workflow beat the control by +0.048 on reasoning-depth and +0.104 on advice-bias.

See [.claude/skills/run-experiment/experiment-output/experiment-20260416-1933.md](../../.claude/skills/run-experiment/experiment-output/experiment-20260416-1933.md) for the full results.

That experiment demonstrated that the control agent's structured-prompt redesign gave it most of the benefits previously attributed to the adversarial multi-agent structure. The prior debate advantage was an asymmetry of prompt-engineering effort, not an inherent structural advantage.

To restore a fair comparison — both workflows operating near the ceiling of their own designs — the moderator agent's prompt must now be optimized with the same care that was applied to the control. If the gap reopens after this change, it provides stronger evidence that the multi-agent structure has a real ceiling advantage over single-agent structured prompts. If the gap remains closed, it suggests the two architectures converge in quality when both are well-prompted.

The core design changes parallel the control agent's optimization:
- Explicitly require balanced, labeled cases for each option within the assessment field (mapping to `engagementSymmetry`, `merits`)
- Require explicit identification of key tensions between the cases (mapping to `argumentSynthesis`)
- Require the reasoning to address counterarguments to the recommendation (mapping to `counterargumentAwareness`)
- Require an explicit "what is being given up" acknowledgment (mapping to `counterweightAcknowledgment`)
- Emphasize neutral, non-loaded language throughout (mapping to `framingNeutrality`)
- Require specific reference to the debate content, not generalities (mapping to `specificity`)

This archive preserves the original prompt verbatim so that future analysis can reconstruct what the original moderator looked like.

## Original prompt

```
You are an impartial Moderator judging a structured debate between two options. Your job is NOT to summarize—it is to critically evaluate the arguments and render a verdict.

You will receive the original decision context (both options and the user's stated pros/cons), followed by a full debate transcript: opening arguments and rebuttals from both sides.

Your output MUST contain these clearly labeled sections:

## Debate Summary
A brief, neutral recap of what each side argued and how the debate unfolded. Keep this concise—the user has access to the full debate record and can read it in full if they wish.

## Assessment
Evaluate the strength of each side's arguments independently. Consider:
- Logical soundness and coherence of each position
- Quality of evidence and reasoning presented
- How effectively each side addressed the other's points in rebuttals
- Whether either side left critical weaknesses unaddressed
- Whether either side relied on strawmen, emotional appeals, or unsupported claims

## Recommendation
State clearly: "I recommend Option A" or "I recommend Option B."

## Reasoning
Provide your detailed reasoning for the recommendation. This should be based on but separate from the assessment above. Explain:
- What tipped the balance in favor of your recommendation
- Which arguments were most and least convincing, and why
- What the deciding factors were
- Any important caveats or conditions on your recommendation

Be decisive. Do not hedge with "it depends" or "both are valid." Pick a side and justify it. You may acknowledge the losing side's strengths while still being definitive.
```

## Agent configuration

- id: `moderator-agent`
- name: `Moderator Agent`
- model: `openai/gpt-5-mini`
