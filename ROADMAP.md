# Nexus Forge — Global product roadmap

## Vision
A Codex-inspired AI workspace that combines an autonomous software engineer with a future creative production agent. The wedge is dependable engineering work: repository understanding, code proposals, tests, CI repair, deployment assistance and release safety.

## Delivered in this PR (v0.2)
- Responsive three-pane workspace: explorer, read-only editor and coding agent chat
- Public GitHub repository file browsing and UTF-8 source preview
- Model Settings: OpenAI, DeepSeek, Groq, OpenRouter, Hugging Face inference, Gemini's OpenAI-compatible API
- User-managed API keys held in memory for the active tab only; backend forwards requests to known provider endpoints
- Configurable model identifier, code-generation or planning mode, contextual file input and conversation history
- Clear preview/execution boundaries; no automatic shell commands, code commits, or deployments
- FastAPI, Docker, Render deployment manifest
- Creative Studio placeholder and product phases

## Next: V1 real coding loop
1. GitHub App authentication, optional private repository selection and short-lived per-user credentials.
2. Checkout repository into per-task isolated worker.
3. Typed agent tool contracts: inspect file, apply patch, search code, run allowed command, run tests.
4. Security boundary: disposable containers with non-root execution, time/CPU/memory constraints and controlled egress.
5. Agent planner/executor with bounded iterations and structured checkpoints.
6. Diff review pane with explicit user approval before write, push or pull request.
7. PR creation, checks, test evidence, task cancel and audit logs.
8. Quality evaluation on real issues, unit tests and CI failure cases.

## V2 production engineering
- Vercel, Render and GitHub Actions integration; failure investigation
- Secrets redaction, role-based access, rate limiting, quotas, team billing and logs
- Build/test execution queue and job progress over websockets or SSE
- Rollback plans and human approval before production actions

## V3 creative agent
- Dedicated creative workspace and brand kit
- Media upload/asset management, storyboards, caption/copy generation
- FFmpeg rendering, timelines, motion graphics, vector/canvas edit tools
- Preview and revision approval before exports or publication

## Key security constraints
- Never execute repository instructions on the API host.
- Treat checked-out code as untrusted.
- Never persist BYOK API keys in localStorage or source code; for production, use encrypted per-user storage or short-lived proxies with explicit consent.
- Rate limit provider proxy requests and authenticate tenants before public commercial launch.
- Requests from the browser to the API carry keys; use HTTPS and only run on trusted infrastructure.
- Provider API use can incur charges even if hosting is free.

## Validation KPIs
- Completed coding tasks passing independent tests
- Time to accepted pull request, accepted PR rate
- Test and CI recovery rate
- Cost per verified task
- User retention and team expansion
- Creative export success, render error rate and revision count
