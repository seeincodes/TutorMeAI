# Observation Schema

Each observation is a markdown file in this directory with the following frontmatter:

```yaml
---
task: "Brief description of what was attempted"
skill: "find-skills"
skill_version: 1
success: true|false
critical: true|false
timestamp: "ISO 8601"
duration_seconds: 0
tokens_used: 0
---
```

## Body Sections

### Error
What went wrong (if `success: false`). Include error messages, stack traces, or unexpected behavior.

### Context
What was happening when the skill was invoked. Include the user's request, the state of the codebase, and any relevant conversation history.

### Files Touched
List of files read, created, or modified during the skill invocation.

### User Feedback
Direct quotes or paraphrased feedback from the user about the skill's output.
