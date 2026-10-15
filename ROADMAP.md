# Nexus CLI / Forge AI — Product roadmap

## Vision
A global AI production-engineering and creative-workflow platform. The first wedge is safe, explainable assistance for taking code from GitHub to production. A separate Creative workspace follows validation of the engineering workflow.

## Phase 0 — MVP (now)
- Public repository metadata and file-tree analysis
- AI-generated preliminary engineering plan through hosted inference
- FastAPI endpoint and responsive engineering dashboard
- Docker + Render deployment manifest
- Protected inference with a server-side API key

**Not yet supported:** reading file bodies, writing code, running tools/tests, deployments, GitHub PR creation, creative rendering, multi-user authentication.

## Phase 1 — Working coding agent
1. GitHub OAuth / GitHub App installation, least-privilege repo scopes.
2. Repo snapshot with source file retrieval; avoid logging credentials.
3. Plan → inspect → patch workflow with explicit tool contracts.
4. Ephemeral container sandbox with CPU/memory/network/time limits.
5. Run targeted tests and lint checks; cap repair iterations.
6. Show diff and test evidence; human approval before a PR.
7. Structured task state, checkpoints, audit events and cancellation.
8. Evaluation benchmarks: task success, test pass rate, PR acceptance, tool error rate, cost per completed task.

## Phase 2 — Production engineer
- CI/CD integrations: GitHub Actions, Vercel, Render, Docker builds.
- Collect logs with redaction; diagnose recurring failures.
- Generate rollout/rollback plans, require human confirmation before deployments.
- Release safety checks, observability, usage metering and organisation permissions.

## Phase 3 — Creative agent
- Brand brief intake and reusable brand kits.
- Upload, inspect and tag media assets.
- Storyboard, shot selection, captions and content calendar generation.
- FFmpeg-based video render pipeline; SVG/Pillow-based graphic compositing.
- Revision loops and human sign-off before publishing.

## Architecture
- Web UI: existing FastAPI-served MVP, later separate Next.js application
- API: FastAPI + Pydantic
- Orchestrator (later): LangGraph + typed tool protocol
- Model gateway: Hugging Face router / DeepSeek with configurable fallback
- Runtime (later): isolated worker containers, queue, object storage
- State (later): PostgreSQL + pgvector; Redis for queues
- CI: test, lint, security and dependency checks

## Global go-to-market hypothesis
First buyer: solo developers and small engineering teams with costly deployment/CI failures. Sell reliability and time saved rather than generic code generation.

Validate before pricing: interview 10 developers; collect 20 real failing builds; evaluate diagnosis quality and resolution rate; aim for repeat use on real production repositories.

## Guardrails
No production modifications without confirmation. Never run untrusted repository commands directly on the API host. Keep model tokens secret. Require authentication, rate limiting and quotas for any publicly accessible paid inference. Default to least-privilege GitHub access. Track inference, compute and storage costs.
