# Context Optimization Contracts

## Core Principle

pi-smart optimizes context usage without losing critical information.

## Token Compression

**Purpose**: Reduce token usage by ~75% without losing meaning.

**Method**: Caveman-style compression
- Remove redundant patterns
- Collapse whitespace
- Shorten common phrases

## Output Filtering

**Purpose**: Clean output for context efficiency.

**Filters**:
- Strip ANSI color codes
- Collapse multiple blank lines
- Shorten file paths
- Remove verbose progress indicators

## Cost Tracking

**Purpose**: Monitor API usage and costs.

**Metrics**:
- Token usage per session
- API calls count
- Estimated cost

## Configuration

| Setting | Values | Default |
| --- | --- | --- |
| intensity | terse, normal, verbose | normal |
| filters | array of filter names | all |
| budget | token limit | none |
