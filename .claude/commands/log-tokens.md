---
description: Append this session's Claude token usage to token_log.md
allowed-tools: Bash, Edit, Read
---

Help me log this session's Claude usage to `token_log.md`:

1. If I haven't already pasted my usage, remind me to run `/cost` and give you the tokens in, tokens out, and cost.
2. Ask me for anything missing — my name and the branch/area I worked on.
3. Append a row to the **Sessions** table with today's date, my name, the branch/area, and the token/cost figures.
4. Update my row in the **Running totals** table: increment my session count and add the tokens/cost.

Don't invent numbers — use only what I give you from `/cost`.
