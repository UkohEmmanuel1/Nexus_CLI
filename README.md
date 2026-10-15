# Nexus CLI — Forge AI MVP

A preliminary AI production-engineering assistant powered by FastAPI and optional Hugging Face hosted inference.

## Current features
- Web dashboard for public GitHub repository analysis
- `GET /health` health endpoint
- `POST /api/analyze` engineering planning API
- Optional DeepSeek model via Hugging Face Inference Providers
- Docker and Render Blueprint deployment configuration

**Scope:** Reads repository metadata and file paths only. Does not execute shell commands, modify repositories, run tests, or create pull requests. Creative agent is planned, not implemented.

## Local setup

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://localhost:8000 and http://localhost:8000/docs.

## Environment variables

- `HF_TOKEN`: Hugging Face Inference Providers API token. Keep private.
- `HF_MODEL`: Default `deepseek-ai/DeepSeek-V4-Pro:novita`.
- `AGENT_API_KEY`: **Required when HF_TOKEN is configured**. A strong secret that clients send in the `X-API-Key` header. Never embed it in public client code.

Without `HF_TOKEN`, the app runs in preview mode without paid model calls.

## Deploy on Render

Create a new **Blueprint** from this repo and set the secrets in the Render dashboard. Confirm actual free plan availability and provider pricing before deploying. Render assigns the live hostname; this repository alone is not a live deployment.

## API example

```bash
curl -X POST http://localhost:8000/api/analyze \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: YOUR_AGENT_API_KEY' \
  -d '{"repo":"tiangolo/fastapi","task":"Identify likely CI/CD risks and plan verification"}'
```

Production TODO: authentication per user, rate limits, observability, secure repository source-code retrieval, sandboxed tool execution, approvals, tests, and pull requests. The browser demo asks for an API key only when needed; for a public commercial frontend use a secure authenticated backend session instead.
