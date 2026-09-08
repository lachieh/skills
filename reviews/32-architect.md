# Review 32: Architect

Status: approved and implemented

Source: `tmp/pstack/skills/architect/SKILL.md`

Implementation: `.apm/skills/architect/SKILL.md`

## Verdict

Keep Architect as an end-to-end design and implementation procedure for
consequential structural decisions.

## Approved changes

- Trigger on consequential module, API, state, ownership, and cross-system
  decisions rather than every function boundary.
- Ground through How and use Why when historical constraints matter.
- Write consumer usage before interfaces and types.
- Let Arena own design alternatives and selection.
- Keep sketches as design artifacts rather than non-working source files.
- Use approved principles as the design standard.
- Run Interrogate for contested or high-risk designs.
- Delegate implementation under one owner in Verifiable Units of Work.
- Return to design when repeated deviations expose a missing constraint.
- Verify completed behavior independently.
