# Command Reference - pi-smart

## Slash Commands

### /smart-intensity
Set compression intensity.

```bash
/smart-intensity terse
/smart-intensity normal
/smart-intensity verbose
```

### /smart-filters
Configure output filters.

```bash
/smart-filters list
/smart-filters enable stripAnsi
/smart-filters disable collapseBlanks
```

### /smart-budget
Configure budget thresholds.

```bash
/smart-budget set 60 80 90
/smart-budget show
```

### /smart-cost
Show cost tracking.

```bash
/smart-cost total
/smart-cost byModel
/smart-cost reset
```

## Tools

### smart_config

```javascript
smart_config action="get" key="<path>"
smart_config action="set" key="<path>" value="<value>"
smart_config action="reset" key="<path>"
```

#### Keys

| Key | Type | Description |
|-----|------|-------------|
| `intensity` | string | terse/normal/verbose |
| `filters.enabled` | boolean | Enable filters |
| `filters.stripAnsi` | boolean | Strip ANSI codes |
| `filters.collapseBlanks` | boolean | Collapse blanks |
| `filters.shortenPaths` | boolean | Shorten paths |
| `filters.truncate` | number | Truncate length |
| `budget.thresholds` | number[] | Budget thresholds |
| `budget.current` | number | Current usage % |
| `cost.total` | number | Total cost USD |
| `cost.byModel` | object | Cost per model |
| `analyze.timeout` | number | Timeout ms |
| `correction.enabled` | boolean | Enable detection |
| `correction.count` | number | Corrections found |

### analyze

```javascript
analyze language="javascript|typescript|python|shell" code="<code>" intent="<description>"
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `language` | string | yes | javascript/typescript/python/shell |
| `code` | string | yes | Code to execute |
| `intent` | string | no | What to analyze |
| `timeout` | number | no | Timeout override |
| `allowNetwork` | boolean | no | Allow network |

#### Returns

```javascript
{
  stdout: "result string",
  stderr: "error string",
  exitCode: 0,
  runtime: 150  // ms
}
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Execution error |
| 2 | Timeout |
| 3 | Sandbox violation |
