---
name: grill-me
description: Interview user relentlessly until shared understanding is achieved
triggers:
  - unclear
  - ambiguous
  - vague
  - unsure
  - what do you mean
  - can you clarify
  - help me understand
  - not sure
  - confused
  - ambiguous requirement
  - missing details
  - incomplete
  - needs more info
  - I don't know
  - undefined
  - assumptions
requirements:
  context: [any task with unclear scope, missing details, or ambiguous requirements]
  tools: []
---

# Grill Me Skill

## Objective

When the user provides unclear, ambiguous, or incomplete information, systematically interview them until shared understanding is achieved. Do not proceed with assumptions—keep asking until both parties clearly understand the problem, scope, and success criteria.

## When to Use

- **Unclear requirements**: User says "build X" but doesn't specify what X is
- **Ambiguous scope**: Terms like "some files", "few features", "improve performance" without specifics
- **Missing details**: Dates, numbers, quantities, dependencies, or constraints not specified
- **Vague success criteria**: No definition of done or acceptance criteria
- **Assumed context**: User assumes knowledge you don't have

## Rule

**NEVER assume**—always ask until clear.
**NEVER proceed** with unclear scope—grill until done.
**Document answers** for future reference.

## Question Flow

### Phase 1: Clarify Intent

```
1. "What specifically should this do?"
2. "What's the concrete input and expected output?"
3. "Who will use this and why?"
4. "What's the simplest version that counts as done?"
```

### Phase 2: Define Scope

```
5. "What should be included? What's out of scope?"
6. "Are there any constraints I should know about?"
7. "What should this NOT do?"
8. "What does 'done' look like?"
```

### Phase 3: Identify Edge Cases

```
9. "What should happen when X goes wrong?"
10. "Are there any special cases I need to handle?"
11. "What inputs or situations should I reject?"
```

### Phase 4: Confirm Understanding

```
12. "Let me restate what I understood. Is this correct?"
13. "Any other requirements I should know?"
14. "Any priorities—start with which features?"
```

## Usage Examples

### Example 1: Unclear Feature Request

**User**: "Build a dashboard for our data."

**Grill**:
> - What kind of data? (metrics, logs, user activity)
> - What metrics matter? (conversions, uptime, revenue)
> - Who views this? (executives, engineers, customers)
> - What interactions? (filters, drill-down, export)
> - When is it considered done?
> - What's the tech stack constraint?
> - Any existing designs to match?

**User** provides specific answers → proceed

### Example 2: Vague Bug Report

**User**: "The form is broken."

**Grill**:
> - Which form? (name, contact, checkout)
> - What happens vs what should happen?
> - Does it error, show wrong data, or fail to submit?
> - Can you give a specific example?
> - Is it browser-specific or universal?
> - What's the URL or user path to reproduce?

**User** provides steps → proceed

### Example 3: Scope Creep Warning

**User**: "Just make it work better."

**Grill**:
> - "Better" in what way? (faster, fewer errors, easier to use)
> - How do we measure improvement?
> - Which part specifically needs work?
> - What's the acceptable baseline vs target?
> - Any constraints on how we improve it?

**User** pins down metric → proceed

## Integration Points

### With memory_search (Before Accepting)

```javascript
// Before grilling, check if this was already clarified
memory_search({ query: "dashboard requirements" })

// After grilling, store the clarified understanding
memory_store({
  category: "decision",
  title: "Dashboard requirements clarified",
  content: "Metrics: uptime, conversions, revenue. Users: executives. Interactions: filters, drill-down, export."
})
```

### With analyze (To Validate)

```javascript
// After grilling, use analyze to verify assumptions
analyze({
  language: "shell",
  code: "grep -rn 'undefined\\|TODO\\|FIXME' src/",
  intent: "Find incomplete code that reveals scope gaps"
})
```

### With pi-audit (To Document)

```javascript
// Store unclear requirements that were clarified
memory_store({
  category: "decision",
  title: "Scope clarification: dashboard",
  content: "Original: 'Build a dashboard' → Clarified: Metrics for executives with filter/drill-down/export"
})
```

## Response Templates

### Initial Clarification
```
Before I start, I need to understand a few things:

1. What specific [feature/problem] are we addressing?
2. What does success look like?
3. What are the constraints?
```

### Mid-Grill Check
```
So far I understand: [restate understanding].
Is this correct so far?
```

### Final Confirmation
```
Here's what I'll build/do:
- [Specific scope]

Is this accurate?
Any priorities or additional requirements?
```

## Anti-Patterns to Avoid

| Bad | Good |
|-----|------|
| Proceed with vague requirements | Ask until clear |
| Assume standard behavior | "What should happen in X case?" |
| Move on after one clarification | Probe multiple angles |
| Accept "just make it work" | Pin down specific metrics |
| Skip edge cases | "What could go wrong?" |

## Key Question Patterns

- **Specific vs General**: "Give me a concrete example"
- **Boundaries**: "What's NOT included?"
- **Metrics**: "How will we know it's done?"
- **Priority**: "What's most important first?"
- **Risks**: "What could go wrong?"
- **Success**: "What does done look like?"
- **Users**: "Who benefits from this?"
- **Impact**: "What happens if we skip this?"

## Exit Criteria

Stop grilling when:
1. Specific inputs and outputs are named
2. Success criteria are measurable
3. Scope boundaries are clear
4. Edge cases are identified
5. User confirms understanding

Then document in memory and proceed.