# Review 06: Boundary Discipline

Status: approved and implemented

Source: `tmp/pstack/skills/principle-boundary-discipline/SKILL.md`

Implementation: `.apm/skills/principle-boundary-discipline/SKILL.md`

## Verdict

Keep this as a principle. Define boundaries by changes in trust, representation,
ownership, side effects, or lifecycle rather than by function or file count.

## Approved concepts

- Convert external input into domain values at ingress.
- Convert domain results into external representations at egress.
- Validate once per trust boundary.
- Keep domain decisions in a pure core and infrastructure in thin adapters.
- Rely on established internal invariants without banning useful assertions.
- Handle errors where a meaningful recovery or decision is possible.
- Keep framework, transport, and storage representations out of the domain.

## Guardrail

An adapter must own a real transition. A forwarding function that changes no
trust, representation, ownership, effect, or lifecycle does not create a useful
boundary.
