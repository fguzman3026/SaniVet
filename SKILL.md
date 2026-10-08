---
name: devlauncher-sdd
description: Spec Driven Development — interviews the user to produce a spec (functional,
  technical, or both) for a feature or product in the current repo, before any code
  is written. Use this skill whenever the user wants to spec out something before
  building it, plan what to build next, write a design doc, or think through requirements
  first. Trigger on phrases like "spec this out", "armemos el spec", "quiero planear X",
  "antes de codear", "SDD", "spec driven", or any time the user wants to think through
  what to build before touching code. On a first project scaffold it also generates a
  one-time design-system doc (look & feel, colors, style), and when the scope is too big
  for a single spec it adds a separate development plan.
---

# Spec Driven Development

The idea: write the spec first, code second. Your job is to interview the user,
extract everything needed to define *what* to build and *how*, then write the spec(s).
No code — just clarity.

## Step 1 — Read context

Before asking anything:
1. Scan the repo structure (top-level dirs, key files)
2. Read existing specs in `sdd/` to understand prior decisions, conventions, and style
3. Note the current stack (package.json, schema, config files)
4. Check whether `sdd/design-system.md` exists. If it doesn't and the work involves UI,
   you'll likely need to create it (Step 3). Note if this looks like a greenfield/first scaffold.

This way you don't ask questions the codebase already answers, and the new spec
fits naturally with what came before.

## Step 2 — Interview

Run a conversational interview. One question at a time — follow the thread,
skip what the codebase already tells you, go deeper where the user seems uncertain.

Cover these areas (adapt depth to scope):

**Scope & problem**
- What are we building or changing? New feature, iteration, or new product?
- What problem does it solve, and for whom?
- What's explicitly out of scope for this version?

**Functional requirements**
- Main screens or flows?
- Walk through the happy path step by step
- Edge cases, empty states, error states
- Does any existing behavior change?

**Data & backend**
- New data? Schema changes?
- External services or APIs involved?

**Technical constraints**
- Stack additions or changes?
- Performance, security, or deployment considerations?

**Decisions**
- Any tradeoffs or alternatives already ruled out? (these belong in the spec)

**Look & feel** (only if `sdd/design-system.md` doesn't exist yet and the work involves UI)
- What's the visual vibe? (minimal, playful, corporate, brutalist, editorial…)
- Brand or preferred colors? Light, dark, or both?
- Typography preferences?
- Any reference apps or sites whose look they love?
- If the user isn't sure, tell them it's fine to skip for now — the design-system can be
  generated later by passing references (screenshots, Dribbble, Pinterest, sites they like).
  Don't force it: a vague, invented design-system is worse than none.

When you have enough to write a complete spec, say so and move to Step 3.
For small-scoped features, 4-5 exchanges is usually plenty — don't over-interview.

## Step 3 — Decide what to write

This isn't Claude Code's plan mode. The standard output is **always two specs** — a
functional spec and a technical spec. Two more artifacts get added only when warranted:

- **Always**: `functional-spec.md` + `technical-spec.md`
- **Add `development-plan.md`** when the request is too big to fit reliably in a single
  spec — roughly: more than ~2-3 distinct screens/flows, crosses multiple layers at once
  (UI + schema + new services/auth), or is clearly multi-session work. It's a *separate*
  artifact that slices the first version into ordered phases and tasks. It sits alongside
  the specs — it does not replace them, and the specs don't hang off of it.
- **Add `design-system.md`** when `sdd/design-system.md` doesn't exist yet and the work
  involves UI (typically the first scaffold of a project). Generated once, project-wide,
  editable later. Skip it if the user couldn't describe a look & feel — they can add it
  later with references.

## Step 4 — Infer the folder name

Pick a short, lowercase, hyphenated name that describes what's being specced.
Examples: `spec-v2`, `spec-offline-sync`, `spec-usd-flow`, `spec-auth-revamp`.
Don't ask — just pick one. The user can rename it later.

## Step 5 — Write the artifacts

File layout:
- `sdd/design-system.md` — project-wide, lives at the **root** of `sdd/` (one per project)
- `sdd/<inferred-name>/functional-spec.md`
- `sdd/<inferred-name>/technical-spec.md`
- `sdd/<inferred-name>/development-plan.md` — only when the scope warrants it (Step 3)

Match the style and language of existing specs in the repo.

**functional-spec.md**
- Lead with the problem (1 short paragraph)
- Scope: what's in and what's explicitly out
- Screen-by-screen or flow-by-flow breakdown
- Validations, edge cases, empty states
- UX notes if relevant (mobile-first, performance, etc.)

**technical-spec.md**
- Stack table (only new or changed rows)
- Data model as SQL (full table definitions)
- Architecture in plain text
- Env vars needed
- Folder structure for new files
- Decisions: tradeoffs and alternatives ruled out
- UI interaction model (always include the section below)

**UI interaction model — non-negotiable defaults for every feature:**
- **Optimistic UI**: mutations update local state immediately, before the server responds. Never block the UI waiting for a server action.
- **Instant navigation**: links and route transitions fire without waiting for data. Use skeleton loaders for content that loads after navigation.
- **Skeleton loaders**: every page that fetches data must define a `loading.tsx` or skeleton component that matches the layout of the real content.
- **Button feedback**: buttons must reflect the action state — pending (spinner or label change), success (check or color change), error (destructive style). Never leave a button looking idle while an action is in flight.
- **Client-side first**: when appropriate, fire the action on the client and finalize the request in the background (`useTransition`, `startTransition`). The user should never wait for a round-trip to interact with the next element.

**development-plan.md — only when the scope is too big for one spec:**
- One-paragraph goal: what the first version delivers once the plan is done
- Ordered **phases** — each phase is a coherent chunk with a clear, shippable outcome
- Under each phase, the concrete **tasks** as a checklist (`- [ ]`)
- Note dependencies and the order things must happen in
- A short "Deferred to post-v1" list at the end
Keep it actionable — tasks a dev (or you) could pick up and execute, not vague themes.

**design-system.md — generated once at the first scaffold; complements, never repeats, the UI interaction model above:**
- Vibe: the personality in 1-2 lines (e.g. "minimal, calm, lots of whitespace")
- Color palette: named tokens with hex — background, surface, text/muted, primary, accent, success, warning, destructive; note light/dark
- Typography: font families, weights, and a simple type scale
- Spacing & shape: spacing scale, border radius, density
- Components: short style notes for buttons, inputs, cards, etc.
- Tone of voice for UI copy (if relevant)
- References: links or screenshots that inspired the direction (Dribbble/Pinterest/real apps)
If the user couldn't describe a look & feel, don't invent one — skip the file and tell them
how to generate it later (pass references).

Write in the same language as the existing specs (check `sdd/` for reference).
Be specific and direct — no filler sentences.
