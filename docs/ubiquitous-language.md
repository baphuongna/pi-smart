# Ubiquitous Language

Shared vocabulary for pi-smart project terms. Use these definitions consistently across all documentation, code, and communication to avoid ambiguity.

---

## Core Concepts

### Hook System
**Definition**: A plugin system that allows extensions to intercept and modify processing at key points in the agent lifecycle.

**Terms**:
- `HookName`: Identifier for a hook point (e.g., `'PreToolUse'`, `'SessionEnd'`)
- `HookMode`: `'blocking'` (can abort) or `'non-blocking'` (accumulates diagnostics)
- `HookOutcome`: Result of hook execution — `'allow'`, `'block'`, `'modify'`, `'diagnostic'`
- `HookContext`: Data passed to hooks containing name, data, and metadata

**Usage**: "Register the `PreToolUse` hook to intercept tool calls before execution."

---

### Budget State Machine

**Definition**: Dynamic adjustment system that tracks token usage and intensifies compression as context fills.

**States** (in order of severity):
- `NORMAL`: Default operating state
- `WARNING`: Usage above warning threshold (default: 70%)
- `CRITICAL`: Usage above critical threshold (default: 85%)
- `EMERGENCY`: Usage above emergency threshold (default: 95%)

**Terms**:
- `contextUsage`: Percentage of context window used
- `threshold`: Percentage that triggers state transition
- `autoIntensify`: Whether compression intensity increases automatically
- `steering`: Injected system message guiding agent behavior

**Usage**: "When budget transitions to CRITICAL, increase compression intensity."

---

### Compression Pipeline

**Definition**: Multi-stage text reduction system applying progressively aggressive filters.

**Stages**:
1. `tokenize`: Split text into tokens
2. `filter`: Remove low-value content
3. `dedupe`: Remove duplicate patterns
4. `compact`: Apply intensity-specific rules
5. `render`: Return compressed output

**Terms**:
- `intensity`: Compression aggressiveness — `'terse'`, `'normal'`, `'verbose'`
- `filter profile`: Named set of rules for specific contexts
- `compression ratio`: Bytes in vs bytes out percentage

**Usage**: "Pipeline stage 2 filters out comments when intensity is terse."

---

### Extension API

**Definition**: Plugin interface for pi-smart integration with the Pi agent runtime.

**Key Events**:
- `session_start`: Fires when agent begins a new session
- `session_shutdown`: Fires when session ends
- `message_end`: Fires after assistant message is generated
- `tool_result`: Fires with result from tool execution
- `turn_end`: Fires after each agent turn completes

**Terms**:
- `ExtensionAPI`: The interface provided to extensions via `registerPiSmart(pi)`
- `ExtensionContext`: Runtime context available during extension execution (cwd, hasUI, etc.)

**Usage**: "Use `pi.on('session_start')` to initialize session state."

---

## Component Terms

### Filter System

| Term | Definition |
|------|------------|
| `filter` | Single rule that transforms or removes text |
| `profile` | Named collection of filters for a specific use case |
| `pipeline` | Ordered sequence of filters applied to input |
| `resolution` | Filter specificity level — `global`, `command`, `file-type` |

**Usage**: "The bash profile applies glob-based filters for output."

---

### Cost Tracking

| Term | Definition |
|------|------------|
| `token` | Unit of LLM computation (input + output) |
| `cost` | Monetary value of token usage based on model pricing |
| `budget` | Maximum allocated spend for session |
| `tracking` | Real-time accumulation of costs as usage occurs |

**Usage**: "Cost tracker accumulates usage and calculates session total."

---

### Steering Messages

**Definition**: Injected prompts that guide agent behavior during specific budget states.

**Terms**:
- `steering message`: System instruction injected when budget state changes
- `system note`: Alternative to steering for one-off guidance
- `auto-compact`: Automatic context reduction trigger

**Usage**: "Steering message tells agent to be concise when budget is CRITICAL."

---

## Governance Terms

| Term | Definition |
|------|------------|
| `GovernancePolicy` | Configuration for hook-level policy enforcement |
| `PrivacyLevel` | Data classification: `public`, `internal`, `confidential`, `restricted` |
| `ConsentRecord` | Audit entry tracking user consent for hook execution |
| `PolicyRule` | Condition-action pair evaluated against hook context |
| `GovernanceEngine` | System that enforces policies and logs audit entries |

**Usage**: "Governance engine checks consent before allowing SessionEnd hook."

---

## Skill Patterns

| Term | Definition |
|------|------------|
| `SKILL.md` | Markdown file defining agent behavior pattern with YAML frontmatter |
| `trigger` | Keyword or phrase that activates a skill |
| `requirement` | Prerequisite for skill activation (tools, context) |
| `rule` | Constraint or directive for skill execution |
| `grill-me` | Skill pattern for interrogating user to achieve shared understanding |

**Usage**: "SKILL.md frontmatter includes `name`, `description`, `triggers`, `requirements`."

---

## Common Abbreviations

| Abbreviation | Expansion |
|--------------|-----------|
| `FTS` | Full-text search |
| `RRF` | Reciprocal rank fusion (result combination method) |
| `BM25` | Ranking function for text retrieval |
| `LLM` | Large language model |
| `CLI` | Command-line interface |
| `API` | Application programming interface |
| `PII` | Personally identifiable information |

---

## Anti-Patterns (Terms to Avoid)

| Instead of | Use |
|------------|-----|
| "hook point" | `HookName` |
| "blocking hook" | `blocking` `HookMode` |
| "context percentage" | `contextUsage` |
| "compress aggressively" | `terse` `intensity` |
| "state change" | `budget state transition` |
| "user consent" | `ConsentRecord` |
| "memory store" | `retain` or `memory_store` tool |

---

## Usage Guidelines

1. **When writing code**: Use the exact type names (e.g., `BudgetState` not "budget state")
2. **When documenting**: Use the defined terms in definitions, not synonyms
3. **When communicating**: Prefer full terms over abbreviations in critical paths
4. **When reviewing**: Flag usage of undefined terms or anti-patterns

---

*This document is the authoritative source for pi-smart terminology. When adding terms, follow the format above and place in the appropriate section.*