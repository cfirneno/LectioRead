---
name: bash detached process teardown
description: Long-running processes spawned from a bash tool call are killed when that call returns, even with setsid/disown — use a workflow instead.
---

Processes started in the background from a `bash` tool invocation (e.g. `setsid bash -c '...' & disown`) are torn down when the launching bash call finishes. `nohup`/`setsid`/`disown` do NOT save them — the platform appears to reap the spawned session/cgroup at tool-call end.

**Symptom:** a detached job runs fine while its launching bash call is still sleeping/blocking, then dies silently (SIGKILL, no error logged) right around when that bash call returns. Short foreground tests always succeed (they finish before the call ends); long detached runs always die mid-way. Easy to misdiagnose as OOM — check memory: if free RAM and JS heap are flat right up to the death, it is NOT memory.

**Fix:** run anything longer than a single bash call (the bash tool caps at 120s) as a **workflow** via `configureWorkflow({name, command: "node script.mjs > /tmp/x.log 2>&1", outputType: "console", autoStart: true})`. Workflows persist independently of bash calls. Poll progress by reading the redirected logfile. `removeWorkflow` it when done.

**How to apply:** any server-side batch job that takes minutes (headless Playwright video recording, long ffmpeg runs, bulk generation) must be a workflow, not a backgrounded bash process.
