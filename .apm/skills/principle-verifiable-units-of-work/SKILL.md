---
name: principle-verifiable-units-of-work
description: Apply to multi-step implementation and delivery. Sequence work so each coherent unit reaches a verified working state before dependent work begins.
---

# Verifiable Units of Work

Sequence work into small, verifiable units. Each unit starts from a known-good
state, makes one coherent change, and ends in a verified working state before
the next begins. Order commits and pull requests the same way so every unit
stands alone and the sequence demonstrates the change. Do not batch changes and
defer verification until the end.
