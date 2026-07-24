---
name: prd-skill
description: Generates a comprehensive Product Requirement Document (PRD) before building new projects to enforce strict project boundaries and prevent AI hallucination.
---

# Agent Skill: PRD Generator

## Overview
When the user asks to start a new project, build a new app, or requests a "PRD", use this skill to generate a structured Product Requirement Document (PRD). Never start writing code or setting up a new project without first defining these requirements.

If the user's initial request is vague, use this template as an interview guide to ask them for the missing information before finalizing the PRD.

## Instructions
When generating a PRD, you MUST fill out every single section of this template completely. Vague inputs lead to vague outputs. Do not proceed to building until the user approves the generated PRD.

---

## PRD TEMPLATE

### PROJECT OVERVIEW
- **Project name:** [What the project is called]
- **One line description:** [What does this do and for who]
- **Primary goal:** [What is the single most important thing this project must achieve]

### TARGET USER
- **Who is the main user:** [Be specific, not "everyone"]
- **What problem are they coming to solve:** [One sentence]
- **What does success look like for them:** [What happens after they use the product]

### PAGES AND STRUCTURE
List every page needed:
- **Page name:** [e.g. Landing Page]
  - **Purpose:** [What must this page do]
  - **Key elements:** [List the must-have sections]
- **Page name:** [e.g. Dashboard]
  - **Purpose:** [What must this page do]
  - **Key elements:** [List the must-have sections]
*(Add as many pages as needed)*

### FEATURES — MUST HAVE
List only what the site cannot launch without:
1. [Feature name] — [One line on what it does]
2. [Feature name] — [One line on what it does]
3. [Feature name] — [One line on what it does]

### FEATURES — NICE TO HAVE
List what would improve it but is not critical:
1. [Feature name]
2. [Feature name]

### DESIGN REQUIREMENTS
- **Overall feel:** [e.g. minimal, bold, corporate, playful, high-end agency]
- **Color preference:** [Specific colors, hex codes, or "AI can decide"]
- **Font style:** [e.g. modern sans-serif like Geist, classic serif]
- **Reference sites to emulate:** [URLs or specific vibes]
- **What to avoid:** [Anything explicitly banned, e.g. "generic AI gradients", "pure black"]

### TECHNICAL REQUIREMENTS
- **Authentication needed:** [Yes/No — login/signup methods]
- **Database needed:** [Yes/No — if yes, what data is stored]
- **Payments needed:** [Yes/No]
- **Mobile responsive:** [Yes — always default to mobile-first]
- **Integrations:** [e.g. Stripe, Google Analytics, Firebase, Supabase]

### CONTENT
- **Copywriting:** [Will the user provide copy, or should the AI generate it]
- **Images:** [Real images / AI generated / Unsplash placeholders]
- **Logo:** [Provided / needs to be created / text only]

### SUCCESS CRITERIA
How will we know this website/app is done well:
1. [e.g. A first time visitor understands what the site does in under 5 seconds]
2. [e.g. The checkout flow works without errors]
3. [e.g. It achieves 90+ Lighthouse performance score on mobile]

---

## Execution Rule
Once the PRD is generated and approved by the user, keep it as an active reference (or save it to `PRD.md`) and strictly abide by its constraints during the build phase.
