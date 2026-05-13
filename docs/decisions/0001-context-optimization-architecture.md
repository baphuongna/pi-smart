# 0001 Context Optimization Architecture

Date: 2026-05-13

## Status

Accepted

## Context

pi-smart needs to optimize context usage without breaking user workflows.

## Decision

Separate concerns into independent modules:
- Compression: Token reduction
- Filtering: Output cleaning
- Cost: Usage tracking
- Config: Runtime settings

## Consequences

Positive:
- Each module can be tested independently
- Users can enable/disable features
- Easy to add new filters

Tradeoffs:
- Some overhead from module separation
