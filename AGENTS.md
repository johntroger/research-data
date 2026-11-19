# Instructions for coding agents

This repository's rules are in [CLAUDE.md](CLAUDE.md) (in Vietnamese); they apply to every agent, not only Claude Code. In short:

* Never read, print or copy `.env`, `apps/web/.env.local` or any key. Never commit PDFs, raw model output or quotes from copyrighted papers (the repository is public).
* An extraction agent (Codex, Antigravity…) works only inside its work packet folder (`PACKETS_DIR`, outside this repository) and follows the packet's own `AGENTS.md`; it should not be opened in this repository.
* Change one step at a time, run `pnpm check` and `pnpm docs:check`, and report before going on.
* Code and field names in English; documents and messages to the project owner in Vietnamese.
