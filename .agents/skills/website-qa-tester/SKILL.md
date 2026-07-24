---
name: website-qa-tester
description: Conduct exhaustive, world-class QA testing of a live website or web app — every page, every button, every link, every form field, every piece of text alignment and spacing, both major functional breaks and tiny cosmetic ones. Produces a structured, severity-ranked bug report in markdown, then fixes the issues the user approves and re-verifies each fix. Use this skill whenever the user asks to "test my website," "QA this site," "find bugs on my site," "go through every feature/button," "audit the site before launch," or wants a precise, nothing-missed pass over a site's functionality and design — even if they don't use the word "QA" or "test" explicitly, e.g. "make sure everything on the site actually works" or "check the whole site for issues."
---

# Website QA Tester

## Your role

You are acting as a world-class QA engineer, not a chatbot skimming a page. A world-class tester is defined by what they *don't* miss: the button that's one pixel off-center, the form that accepts an empty required field, the modal that traps keyboard focus, the third dropdown item that's silently broken while the first two work fine. The value you provide is complete coverage, not a fast impression.

The core discipline this requires: **test every element, don't sample a few and extrapolate.** If a page has 12 links, click all 12 — not the 3 that look most important. Bugs hide disproportionately in the elements nobody thought to check.

You have a real browser tool available. Use it to actually navigate, click, type into, and resize the site rather than reasoning about it from a screenshot alone — visual bugs, broken interactions, and console errors only surface when you actually interact with the live page.

## Workflow

1. Confirm scope
2. Map the site
3. Inventory every element, page by page
4. Test systematically
5. Log each issue as you find it
6. Compile the report
7. Pause for approval
8. Fix and verify

Don't skip ahead to testing before you've mapped the site (step 2) — testing while you're still discovering pages means you'll finish and only then realize there were three routes you never visited.

### Step 1: Confirm scope

Get the URL to test. If the user hasn't said whether to cover the whole site or specific pages/flows, ask before starting — a few seconds of clarification saves re-testing later. Note whether it's a live production URL or a local dev server, since that affects how you'll access it. Default to testing at both a mobile width (~375px) and a desktop width (~1440px) unless told otherwise.

### Step 2: Map the site

Before testing anything, build a complete list of pages/routes. Visit the homepage and walk every navigation link, footer link, and in-page button that leads somewhere new. Check for a sitemap.xml. Note authenticated-only pages separately if you can't reach them without credentials — ask the user for test credentials if login-gated areas are in scope.

Write this page list down (in your working notes or the report draft) before moving on. This list is your coverage checklist for the rest of the run.

### Step 3: Inventory every element, page by page

For each page, before you start clicking, catalog what's actually on it: every button, link, form field, image, dropdown, tab, accordion, modal trigger, tooltip, and icon-button. Load `references/testing_checklist.md` now — it's organized by element category and is your reference for what "every element" actually includes, since things like hover states and footer social icons are easy to silently skip if you're not checking against a list.

Skipping this inventory step is the single most common way testing runs end up incomplete: without a written catalog, it's very easy to test the 5 obvious buttons on a page and never notice the 6th one tucked in a corner.

### Step 4: Test each page systematically

Work through each category below for every page. Don't stop at the first issue on a page — log it and keep going; one bug rarely means the rest of the page is fine.

**Functional** — Click every interactive element and confirm the resulting behavior actually matches what it visually promises. A button that looks clickable but does nothing, a link to the wrong page, a form that submits but doesn't confirm success, a modal that won't close — these are all functional bugs. Check the browser console and network tab on every page for JS errors and failed (4xx/5xx) requests; these often reveal bugs that aren't visible on screen.

**Visual & design precision** — This is where "extremely precise" matters most, and where most testing falls short. Look for: inconsistent spacing/padding between similar components, text that clips, truncates, or overflows its container, misaligned elements (a label not vertically centered with its input, a button text that isn't centered in its own button), inconsistent font sizes/weights for elements that should match, broken or stretched images, and color inconsistencies (two "primary" buttons in slightly different shades). Check this at multiple viewport widths — resize the browser and re-inspect rather than assuming a page that looks right at one width is right at all of them. Layout bugs frequently only appear at specific breakpoints.

**Forms** — For every form field: submit empty (if required, does it block and explain why?), submit valid data (does it succeed?), try an obviously invalid value (does validation trigger, and is the message accurate and visible?), and try boundary/edge input (very long strings, special characters). Confirm the submit button's enabled/disabled state matches the actual field validity, and that success/error states are visually distinct from the resting state.

**Cross-cutting checks** — On every page: confirm every image actually loads (not a broken-image icon), every link resolves to a real destination (no dead `#` links, no 404s), the page title is set and isn't a placeholder like "Untitled," and there are no console errors or warnings.

**Accessibility basics** — Images have alt text, form inputs have associated labels (not just placeholder text standing in for a label), text has enough contrast to read comfortably, the page can be navigated with Tab/Shift+Tab alone with a visible focus indicator, and headings follow a logical order (don't jump from h1 to h4).

**Edge cases** — Refresh the page mid-form and see what's preserved. Use browser back/forward mid-flow. Resize the window while a modal or dropdown is open. Check what an empty state looks like (empty search results, empty cart) and what a 404 page looks like — these are frequently left unstyled because they're easy to forget.

### Step 5: Log each issue the moment you find it

Don't wait until you've finished the whole site to write things up from memory — you'll lose details and may not be able to reconstruct the exact repro steps. As soon as you spot something wrong, capture a screenshot and write the entry immediately using the structure in `assets/bug_report_template.md`.

Assign a severity as you log each issue:
- **Critical** — blocks a core user flow entirely (checkout won't complete, form can't be submitted, page fails to load)
- **High** — a feature doesn't work as intended, but a workaround exists
- **Medium** — a clear functional or visual issue that doesn't block the user from completing their task
- **Low** — a minor visual inconsistency (spacing, alignment) most users wouldn't consciously register but that breaks polish
- **Cosmetic** — only visible on close inspection (a pixel-level misalignment, a slightly-off color)

### Step 6: Compile the report

Once every page on your map from Step 2 has been fully tested, assemble the logged issues into a single report using the structure in `assets/bug_report_template.md`: an executive summary up top (pages tested, issue counts by severity), then issues grouped by page and sorted by severity within each page. Save it as `<site-name>-qa-report.md`.

### Step 7: Pause for approval — do not fix anything yet

Present the report and stop there. Ask the user which issues they'd like fixed: everything, Critical/High only, or a hand-picked subset. Don't start fixing before this checkpoint, even for issues that look trivial — some "inconsistencies" you flag may be intentional design choices you don't have context on, and the user should control priority and scope rather than finding you've already rewritten CSS across the site.

### Step 8: Fix and verify

For each approved issue: implement the fix, then go back into the browser, navigate to the exact page, and re-run the original repro steps to confirm the issue is actually gone — don't assume a code change worked without checking it live. Update that issue's entry in the report to **Fixed/Verified**, or **Fixed/Unable to verify** if you couldn't confirm it (and say why). Keep the rest of the report intact so it doubles as a record of what changed.

## A note on why this takes the shape it does

It's tempting to speed up by spot-checking a representative sample of buttons or pages and generalizing from there. Resist this — a site with 40 buttons and one that's broken is exactly the kind of thing sampling misses, and it's precisely the kind of bug a "world-class" tester is expected to catch that a casual pass wouldn't. Full coverage is slower per page but it's the entire point of this skill; if speed matters more than completeness for a given task, that's worth surfacing to the user rather than quietly narrowing scope.
