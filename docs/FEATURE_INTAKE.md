# Feature Intake

Every implementation prompt enters the intake gate before code changes.

## Intake Flow

```text
User prompt
    |
    v
Classify input type
    |
    v
Restate as work item
    |
    v
Find affected product docs
    |
    v
Run risk checklist
    |
    v
Choose lane: tiny, normal, or high-risk
```

## Lanes

### Tiny
Low-risk docs, copy, or narrow edits. Patch directly.

### Normal
Story-sized behavior with bounded blast radius.
- Create or update story file
- Link relevant product docs
- Update `docs/TEST_MATRIX.md`

### High-Risk
Security enforcement or breaking changes.
- Create story folder
- Ask for human confirmation
- Record decision

## Risk Checklist

| Risk flag | Applies when |
| --- | --- |
| Compression logic | Changes compression algorithm |
| Output format | Changes filter output format |
| Breaking change | May break existing users |
| Cost model | Changes cost tracking logic |

## Output

```text
Lane: normal
Reason: adds new output filter for markdown
Story: docs/stories/US-XXX-new-filter.md
Validation: unit tests
```
