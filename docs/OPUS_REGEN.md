# Opus Prompt Regeneration Guide

This guide explains how to use the Opus prompt templates in `scripts/opusprompts/` to regenerate or extend OpenSchool components using Claude or other LLMs.

---

## Overview

The `scripts/opusprompts/` directory contains structured prompt templates designed for AI-assisted code generation. Each prompt targets a specific part of the codebase and includes:

- **Context** - What the prompt generates and why
- **Constraints** - Technical requirements the output must satisfy
- **Template** - The actual prompt text with placeholders
- **Expected output** - What the LLM should produce

---

## Available Prompts

| File | Purpose |
|------|---------|
| `ui_scaffold.prompt` | Generate new HTML pages following the OpenSchool layout pattern |
| `css_component.prompt` | Create new CSS component files matching the design system |
| `js_module.prompt` | Scaffold a new JavaScript module with proper imports and exports |
| `data_schema.prompt` | Generate JSON Schema and sample data for new entities |
| `flask_endpoint.prompt` | Add new Flask API endpoints to the server |
| `test_suite.prompt` | Generate test cases for existing modules |

---

## How to Use

### Step 1: Choose the Right Prompt

Select the prompt template that matches what you want to generate. Read the introductory comments in the `.prompt` file.

### Step 2: Fill in Placeholders

Each prompt has `{{PLACEHOLDER}}` sections. Replace them with your specific requirements:

```
{{ENTITY_NAME}} -> "events"
{{FIELDS}} -> "id, title, date, location, description, organizer_id"
{{ROLE_ACCESS}} -> "admin: full CRUD, teacher: read + create, student: read only"
```

### Step 3: Submit to LLM

Copy the filled prompt and submit it to Claude (or another capable LLM). The prompts are designed for Claude Opus but work with other models.

### Step 4: Review and Integrate

- Verify the output follows OpenSchool conventions (see `docs/CODE_STYLE.md`)
- Check that no emoji or special characters are used
- Ensure WCAG 2.1 AA compliance
- Test in both light and dark themes
- Validate against JSON schemas if applicable

---

## Prompt Design Principles

### Context Window Efficiency
Each prompt includes only the necessary context:
- Design token names (not full values)
- BEM class naming patterns
- Module import/export signatures
- Data schema shapes

### Constraint Enforcement
Prompts explicitly state:
- No frameworks or CDN dependencies
- No emoji in source code
- ASCII-only comments
- Proper ARIA attributes
- `prefers-reduced-motion` support

### Reproducibility
Prompts are deterministic enough that regenerating with the same inputs produces structurally equivalent output, even if exact code differs.

---

## Creating New Prompts

Follow this template structure:

```markdown
# Prompt: [Component Type]
## Context
[What this prompt generates and where it fits in the project]

## Constraints
- [Technical requirement 1]
- [Technical requirement 2]
- ...

## Inputs
- {{PLACEHOLDER_1}}: [Description]
- {{PLACEHOLDER_2}}: [Description]

## Template
[The actual prompt text with placeholders]

## Expected Output
[Description of what the LLM should produce]
```

### Tips for Effective Prompts
1. Include example output patterns from existing code
2. Reference specific file paths and import statements
3. List CSS class names the component should use
4. Specify ARIA roles and keyboard interaction patterns
5. State what should NOT be included (emoji, inline styles, etc.)

---

## Validation

After generating code with a prompt:

1. Run the schema validator: `node scripts/schema-check.js`
2. Run the smoke test: `node scripts/ui-smoke-test.js`
3. Test keyboard navigation manually
4. Verify in all three themes (light, dark, high-contrast)
5. Check the browser console for errors
6. Confirm animations respect reduced motion settings

---

## Updating Prompts

When the codebase changes (new tokens, renamed classes, etc.), update the prompts to match:

1. Search for affected `{{PLACEHOLDER}}` references
2. Update example code snippets
3. Add new constraints if conventions change
4. Increment the version comment at the top of each prompt file
