---
name: principle-finish-the-migration
description: Apply to internal migrations without concrete external or persisted compatibility requirements. Migrate every in-scope caller and remove the old contract.
---

# Finish the Migration

An internal migration is complete only when every in-scope caller uses the new
contract and the old contract is gone. Remove legacy APIs, compatibility
adapters, obsolete tests, stale documentation, and superseded branches in the
same migration. Do not preserve dual paths for hypothetical consumers.
Do not introduce compatibility paths solely to keep an unfinished internal
migration usable.
