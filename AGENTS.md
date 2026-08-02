<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **HABITFLOW** (42009 symbols, 98978 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/HABITFLOW/context` | Codebase overview, check index freshness |
| `gitnexus://repo/HABITFLOW/clusters` | All functional areas |
| `gitnexus://repo/HABITFLOW/processes` | All execution flows |
| `gitnexus://repo/HABITFLOW/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |
| Work in the Scripts area (2114 symbols) | `.claude/skills/generated/scripts/SKILL.md` |
| Work in the Visitors area (780 symbols) | `.claude/skills/generated/visitors/SKILL.md` |
| Work in the Live area (457 symbols) | `.claude/skills/generated/live/SKILL.md` |
| Work in the Tests area (313 symbols) | `.claude/skills/generated/tests/SKILL.md` |
| Work in the Rules area (302 symbols) | `.claude/skills/generated/rules/SKILL.md` |
| Work in the Engine area (249 symbols) | `.claude/skills/generated/engine/SKILL.md` |
| Work in the Detector area (248 symbols) | `.claude/skills/generated/detector/SKILL.md` |
| Work in the Unit area (240 symbols) | `.claude/skills/generated/unit/SKILL.md` |
| Work in the Lbug area (237 symbols) | `.claude/skills/generated/lbug/SKILL.md` |
| Work in the Kotlin area (220 symbols) | `.claude/skills/generated/kotlin/SKILL.md` |
| Work in the Storage area (194 symbols) | `.claude/skills/generated/storage/SKILL.md` |
| Work in the Cpp area (192 symbols) | `.claude/skills/generated/cpp/SKILL.md` |
| Work in the Ingestion area (189 symbols) | `.claude/skills/generated/ingestion/SKILL.md` |
| Work in the Services area (183 symbols) | `.claude/skills/generated/services/SKILL.md` |
| Work in the Cli area (176 symbols) | `.claude/skills/generated/cli/SKILL.md` |
| Work in the Integration area (157 symbols) | `.claude/skills/generated/integration/SKILL.md` |
| Work in the Group area (130 symbols) | `.claude/skills/generated/group/SKILL.md` |
| Work in the Local area (127 symbols) | `.claude/skills/generated/local/SKILL.md` |
| Work in the Passes area (126 symbols) | `.claude/skills/generated/passes/SKILL.md` |
| Work in the Live-e2e area (123 symbols) | `.claude/skills/generated/live-e2e/SKILL.md` |

<!-- gitnexus:end -->
