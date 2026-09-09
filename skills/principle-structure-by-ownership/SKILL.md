---
name: principle-structure-by-ownership
description: Apply when placing code, shaping monorepo packages, or reorganizing feature folders and imports. Make ownership, sharing scope, and public boundaries visible in the structure.
---

# Structure by Ownership

Place code at the narrowest scope that owns its behavior and serves its actual
consumers. Let the folder tree express feature ownership and the package graph
express deliberate dependencies. Widen either boundary only when a concrete
need justifies the larger public surface and change impact.

## Shape folders

Keep each feature together, with its implementation, tests, and assets. Repeat
the same internal organization at package, feature, and nested-feature levels:
use local buckets such as `components/`, `data/`, and `helpers/` only as needed.
Name modules for the behavior they own; split growing files along cohesive
responsibilities. Avoid scattering one feature across repository-wide technical
buckets or creating empty folders to complete a template.

Keep route-private code inside its route subtree. When sibling routes need the
same behavior, move that behavior to their nearest shared owner instead of
importing sideways. Use the framework's routing exclusion convention only where
it has routing meaning. Resolve dependency cycles by extracting the shared
responsibility or correcting dependency direction.

## Shape packages

Distinguish sharing within an application from sharing across workspace
consumers. Extract a package for demonstrated reuse or a concrete runtime,
build, or distribution boundary. Give it a cohesive purpose and account for
the manifest, exports, build, and deployment upkeep it introduces. A directory
getting large is a reason to examine its modules, not sufficient reason for a
new package.

Keep the package graph acyclic. Import across packages through declared package
names and public entry points; express privacy through the package's exports
map, not folder-name decoration or relative paths into another package's source.
Within a feature, prefer direct relative imports of defining modules over
re-export barrels. Expose intentional package entry points without exposing
every internal file.

Use named exports so consumers inherit the author's names. Where tooling
requires a default export, retain a named export too when the framework permits
it, and keep the exception at that entry point.

Break this rule sooner than add a package or folder layer that obscures ownership
without establishing a useful boundary. Follow project-specific layout and
runtime conventions rather than transplanting another framework's tree.

## Sources

Adapted from Charming's `agent-skills/module-structure/SKILL.md` and Straw Hat's
ADRs on [React project structure](https://straw-hat-team.github.io/adr/adrs/5541831634/README.html)
and [JavaScript module exports](https://straw-hat-team.github.io/adr/adrs/4937890790/README.html).
The ADRs are licensed under CC BY 4.0. This principle generalizes their guidance;
framework-specific paths and fixed extraction thresholds remain local policy.
