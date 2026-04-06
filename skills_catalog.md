# Skills Catalog — Omnichannel Supermarket System Architecture

> Generated: 2026-04-06
> Project: Swiggy Instamart-Parity Supermarket App with ERPNext Backend

---

## Core Agent Skills

| SKILL_TAG | Tool/Skill | Description | Used In Tasks |
|-----------|-----------|-------------|---------------|
| `[SYSTEM_DESIGN]` | `engineering:system-design` | System architecture design framework — requirements, HLD, deep dive, scale, trade-offs | T5, T6, T7 |
| `[DESIGN_HANDOFF]` | `design:design-handoff` | Generate developer handoff specs from UI designs — measurements, tokens, states, interactions | T3, T6 |
| `[DESIGN_CRITIQUE]` | `design:design-critique` | Structured design feedback on usability, hierarchy, consistency, accessibility | T3 |
| `[ARCHITECTURE_ADR]` | `engineering:architecture` | Architecture Decision Records — evaluate technology choices and trade-offs | T5, T6 |
| `[BRAINSTORMING]` | `superpowers:brainstorming` | Creative exploration before building — feature ideation, approach generation | T4 |
| `[WRITING_PLANS]` | `superpowers:writing-plans` | Multi-step implementation planning from specs/requirements | T7 |
| `[DISPATCHING]` | `superpowers:dispatching-parallel-agents` | Parallelize independent research/tasks across subagents | T4 |

---

## Research & Documentation Tools

| SKILL_TAG | Tool | Description | Used In Tasks |
|-----------|------|-------------|---------------|
| `[WEB_SEARCH]` | `WebSearch` | Search the web for documentation, APIs, current information | T2, T4 |
| `[WEB_FETCH]` | `WebFetch` | Fetch and extract content from URLs (documentation pages) | T4 |
| `[CONTEXT7]` | `mcp__plugin_context7_context7__resolve-library-id` / `query-docs` | Fetch current official docs for libraries (Next.js, React, etc.) | T4, T5, T6 |

---

## UI Design & Prototyping Tools (Stitch MCP)

| SKILL_TAG | Tool | Description | Used In Tasks |
|-----------|------|-------------|---------------|
| `[STITCH_PROJECT]` | `mcp__stitch__get_project` | Retrieve Stitch project details and metadata | T3 |
| `[STITCH_SCREENS]` | `mcp__stitch__list_screens` | List all screens within a Stitch project | T3 |
| `[STITCH_SCREEN]` | `mcp__stitch__get_screen` | Get detailed screen data (components, layout, code) | T3 |
| `[STITCH_DS]` | `mcp__stitch__list_design_systems` | List design system tokens for a project | T3 |

---

## Browser Automation Tools

| SKILL_TAG | Tool | Description | Used In Tasks |
|-----------|------|-------------|---------------|
| `[CHROME_NAV]` | `mcp__Claude_in_Chrome__navigate` | Navigate Chrome to URLs for research | T4 |
| `[CHROME_READ]` | `mcp__Claude_in_Chrome__read_page` / `get_page_text` | Read page content from Chrome tabs | T4 |
| `[CHROME_TABS]` | `mcp__Claude_in_Chrome__tabs_context_mcp` / `tabs_create_mcp` | Manage Chrome MCP tab sessions | T4 |
| `[PLAYWRIGHT]` | `mcp__plugin_playwright_playwright__browser_*` | Headless browser automation (navigate, snapshot, screenshot) | T4 |

---

## Figma Design Tools

| SKILL_TAG | Tool | Description | Used In Tasks |
|-----------|------|-------------|---------------|
| `[FIGMA_CONTEXT]` | `mcp__60beef77__get_design_context` | Get design context, screenshots, and code from Figma nodes | T3 |
| `[FIGMA_SEARCH]` | `mcp__60beef77__search_design_system` | Search for design system components, variables, styles | T3 |
| `[FIGMA_SCREENSHOT]` | `mcp__60beef77__get_screenshot` | Capture screenshots of Figma design nodes | T3 |

---

## File & Code Tools

| SKILL_TAG | Tool | Description | Used In Tasks |
|-----------|------|-------------|---------------|
| `[WRITE]` | `Write` | Create new files (architecture docs, schemas) | All |
| `[EDIT]` | `Edit` | Modify existing files | All |
| `[READ]` | `Read` | Read files from filesystem | All |
| `[GLOB]` | `Glob` | Find files by pattern | All |
| `[GREP]` | `Grep` | Search file contents by regex | All |
| `[BASH]` | `Bash` | Execute shell commands | All |

---

## Task Management

| SKILL_TAG | Tool | Description | Used In Tasks |
|-----------|------|-------------|---------------|
| `[TODO]` | `TodoWrite` | Track task progress through the session | All |
| `[AGENT]` | `Agent` | Dispatch parallel subagents for independent research | T4 |

---

## Skill Tag Quick Reference for Task Execution

- **Task 1** → `[WRITE]`
- **Task 2** → `[WRITE]`, `[WEB_SEARCH]`
- **Task 3** → `[STITCH_PROJECT]`, `[STITCH_SCREENS]`, `[STITCH_SCREEN]`, `[STITCH_DS]`, `[DESIGN_HANDOFF]`, `[DESIGN_CRITIQUE]`
- **Task 4** → `[WEB_SEARCH]`, `[WEB_FETCH]`, `[CONTEXT7]`, `[DISPATCHING]`, `[AGENT]`
- **Task 5** → `[SYSTEM_DESIGN]`, `[ARCHITECTURE_ADR]`, `[WEB_SEARCH]`, `[WRITE]`
- **Task 6** → `[SYSTEM_DESIGN]`, `[DESIGN_HANDOFF]`, `[CONTEXT7]`, `[WRITE]`
- **Task 7** → `[SYSTEM_DESIGN]`, `[WRITING_PLANS]`, `[WRITE]`
