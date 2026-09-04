---
description: Commit the current work and push the feature branch (follows CLAUDE.md workflow)
argument-hint: [optional commit message]
allowed-tools: Bash
---

Commit and push the current work, following the git workflow in CLAUDE.md:

1. Run `git status` and show me exactly what will be committed.
2. If I'm on `main`, STOP and create a feature branch (`<firstname>/<short-feature>`) first — never commit to `main`.
3. Stage the relevant changed files by name (not `git add -A`) and commit. Use "$ARGUMENTS" as the commit message if I provided one; otherwise draft a concise, purpose-focused message from the diff. End with the `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` trailer.
4. Before pushing, confirm the active GitHub account is `danielblaski-veeva` (`gh auth status`); if not, switch with `gh auth switch --user danielblaski-veeva`.
5. Push the branch. If no PR exists for it yet, offer to open one to `main` (which needs one teammate's review before merge).
