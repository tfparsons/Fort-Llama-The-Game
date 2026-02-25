# /ship — Trunk Ship

Ship a change: issue → branch → commit → PR → merge. Trunk-based dev, atomic PRs.

## Input

$ARGUMENTS — one-line description of what to ship (e.g. "fix vite port clash")

## Workflow

1. **Issue** — Create on `origin` repo (`tfparsons/Fort-Llama-The-Game`) via `gh issue create`. Title = description. Body = concise context + acceptance criteria. Apply labels if obvious fit exists (check repo labels first, never invent).

2. **Branch** — Name = issue slug matching title (e.g. `fix-vite-port-clash`). Branch from `origin/main`. One branch per issue, one issue per PR.

3. **Commit** — Stage only files relevant to this change. Commit message: imperative mood, `Closes #N` in body. Small, atomic — if change doesn't make sense alone, it shouldn't be a separate PR.

4. **PR** — Push to `fork` remote, PR targets `origin/main`.
   - Title matches issue title
   - Body: `## Summary` (1-3 bullets) + `## Test plan` + `Closes #N`
   - Assign self (`alexfosterinvisible`)
   - Request review from `tfparsons`
   - Link parent/child issues if relevant (use "Part of #N" in body)

5. **Stacking** — Agent decides: if changes are independent, ship as separate PRs. If dependent, note dependency in PR body ("Depends on #N") and stack branches.

## Rules

- Concise everywhere — no walls of text in issues or PRs
- Self-contained — reader understands the change without external context
- Always link: PR ↔ issue, parent ↔ child
- Never create labels/milestones that don't exist
- Check `gh label list` before applying labels
- If merge requested: approve and merge own PR only when explicitly told to
