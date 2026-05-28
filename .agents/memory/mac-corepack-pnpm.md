---
name: Corepack hijacks pnpm on Mac
description: Why `pnpm --version` can fail or hang on a Mac even after `npm install -g pnpm`, and how to bypass.
---

macOS Node installs (Homebrew, nvm, official .pkg) ship with Corepack enabled. Corepack registers a shim named `pnpm` on PATH that tries to download a pnpm version pinned by the project's `packageManager` field. If the network is restricted, the shim is broken, or the project pins a version corepack cannot fetch, every `pnpm` invocation hangs or errors — even after the user runs `npm install -g pnpm@<x>` successfully.

**Why:** The corepack shim is earlier on PATH than the npm-global bin (`~/.npm-global/bin`), so it wins name resolution.

**How to apply:** When `pnpm <anything>` misbehaves on a Mac:
1. Confirm npm-global pnpm exists: `~/.npm-global/bin/pnpm --version` (prints the installed version).
2. Use the absolute path everywhere for that session: `~/.npm-global/bin/pnpm install`, `~/.npm-global/bin/pnpm <script>`.
3. Permanent fix (optional, only if user asks): `corepack disable` then `hash -r`.

Do NOT spend time trying to diagnose the corepack shim itself — calling the absolute path sidesteps it entirely and saves the user time.
