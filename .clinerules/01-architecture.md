# Architecture Constraints

## Dependency Direction

Dependencies point inward: `adapters → application → domain`. Domain code
must never import from `application` or `adapters`.

If domain needs external capabilities (persistence, time, RNG), define
the interface in `domain` (Protocol/ABC), implement in `adapters`.

## API Boundary

Frontends interact through the API only. Never import Python domain code
directly into frontend code.

## Abstraction Test

Before adding interfaces, base classes, or shared helpers:

1. Is this used in at least two places now (not "will be")?
2. Is duplication causing actual maintenance problems?
3. Does the abstraction improve readability?

If any answer is no, write the direct version instead.

## What NOT to do

- Don't let API models double as domain models
- Don't put business logic in route handlers or CLI commands
- Don't reach for plugin/strategy patterns without a concrete second case
