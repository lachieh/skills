---
name: principle-attack-the-premise
description: Apply when repeated fixes rely on the same assumption and fail the same check. Test that assumption before trying another variation.
---

# Attack the Premise

When two or more fixes share an assumption and fail the same check, write down
the assumption and test it before attempting another fix that depends on it.
Choose an observation that distinguishes the competing explanations. Repeated
failure is a reason to investigate the premise, not proof that it is false.

For an imbalance across workers, tenants, or other actors, measure the
distribution per actor across comparable runs. If the same actors repeatedly
carry the excess, trace what assigns their work or ownership. Correct an
unintended assignment when the evidence supports it. An even distribution rules
out that observed skew, not every possible cause or shared assumption.

Keep the probe and its result reproducible. Use `principle-fix-the-latent-issue`
to select the correction once the causal mechanism is established.

Break this rule sooner than repeat an expensive experiment whose existing
evidence already settles the assumption. Record that evidence and proceed.
