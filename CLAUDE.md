# PTO Approver — Team Collaboration Rules

16-bit beat-'em-up (Vanilla JS + Vite). This file is the team's working agreement **and** the ruleset every Claude Code session must follow. Read it before making changes.

**Team:** Daniel Blaski · Krisztian Hajdu · Gergely Juhasz — 3-person team. Playable-demo deadline: **22 September 2026**.

---

## Project basics

- **Run:** `npm install` then `npm run dev` → http://localhost:8080/
- **Build:** `npm run build`
- **Stack:** Plain JavaScript, no framework. Source in `src/` (`engine/`, `game/`, `graphics/`, `audio/`). Art in `public/assets/`.

## Project commands (Claude Code slash commands)

Committed in `.claude/commands/` — available to everyone who pulls the repo:

- **`/dev`** — start the dev server on port 8080 (skips if one is already running).
- **`/push [message]`** — commit the current work and push the feature branch, following the workflow below (won't commit to `main`, checks the push account, offers a PR).
- **`/log-tokens`** — append this session's `/cost` figures to `token_log.md`.

---

## Git workflow (every session)

1. **Never commit directly to `main`.** All work goes on a feature branch.
2. **Branch naming:** `<firstname>/<short-feature>` — e.g. `daniel/bugfix-pass`, `krisztian/enemy-ai`, `gergely/stage2-art`.
3. **Start of session:** `git checkout main && git pull`, then create/switch to your feature branch.
4. **Commit** focused changes with clear messages (see commit style below).
5. **Push** your branch and **open a PR to `main`**.
6. **Merge policy — PR + 1 review:** every PR needs **one other teammate's approval** before it merges. No self-merging.
7. **Merge** after approval: `gh pr merge <n> --merge`, then `git checkout main && git pull` to sync.
8. Delete the branch once merged (optional): `git branch -d <branch>` and `git push origin --delete <branch>`.

### GitHub account gotcha (important)

Pushes must use the **`danielblaski-veeva`** GitHub account — it has org write access. The personal `danielblaski` account does **not** and will fail with a 403.

- Check active account: `gh auth status`
- Switch if needed: `gh auth switch --user danielblaski-veeva`

---

## Token-cost logging (every session, every user)

We track Claude spend per person in [`token_log.md`](./token_log.md).

**At the end of each working session:**
1. Run `/cost` in Claude Code to read your session's tokens in/out and cost.
2. Append a row to the **Sessions** table in `token_log.md` (date, person, branch/area, tokens in/out, cost).
3. Update your row in the **Running totals** table.
4. Find your Claude login email via `/status` if you haven't filled it in yet.

A **Stop hook** (`.claude/settings.json`) prints a reminder when a session ends so this doesn't get forgotten.

---

## Rules for Claude Code

These apply to every Claude Code session in this repo:

- **Never** push, merge, open/close PRs, or delete branches without the user explicitly confirming that action in the current turn. Authorization is per-action, not standing.
- **Never** commit directly to `main` — always work on a feature branch.
- Run `git status` before any command that could discard uncommitted work.
- Keep commits focused and small; do not bundle unrelated changes.
- At the end of a working session, remind the user to log tokens (`/cost` → `token_log.md`) if they haven't.
- When a push fails with a 403, check `gh auth status` and switch to `danielblaski-veeva` before retrying — do not change the remote URL.

### Commit style

Use concise, purpose-focused messages and end with the co-author trailer:

```
<type>: <what changed and why>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
