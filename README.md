# Nexus Forge — AI Engineering Workspace

A Codex-inspired browser workspace and bring-your-own-key coding assistant. The dashboard offers a public GitHub repository explorer, file preview and conversational AI-generated plans or code suggestions.

**Current status: MVP v0.2.** No terminal execution, code writes, git commits, tests, PR automation or autonomous deployment yet. The Creative Studio is a planned second workspace.

## Features
- Three-pane UI: file explorer, code preview, agent chat
- Browse source files in **public** GitHub repositories
- Settings → provider, model and API key
- Providers: OpenAI, DeepSeek, Groq, OpenRouter, Hugging Face Inference, Gemini (OpenAI-compatible)
- API keys remain in current browser tab memory; requests go through FastAPI to preconfigured provider URLs
- Generate code suggestions using selected open file as context
- Docker-ready FastAPI backend and Render deployment blueprint

## Run locally

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open **http://localhost:8000**. API docs at **http://localhost:8000/docs**.

## Start coding
1. Open the app and enter a public GitHub repository such as `UkohEmmanuel1/Nexus_CLI`.
2. Click the arrow to load the file tree; select a text file to preview it.
3. Click **Settings** and choose your provider, model identifier and API key.
4. In the agent pane, ask for a code change. Keep **Include open file** enabled to supply real source context.
5. Review and manually apply generated code suggestions. This version cannot edit files directly.

## Important security notes
Keys are NOT saved in GitHub, cookies or localStorage, but they **are sent to this backend** so it can invoke your provider. Enter keys only in a deployment you control and trust; enable HTTPS, authentication, abuse prevention, request size/rate limits and cost controls before public beta. Providers may bill per token. Do not expose your API key in screenshots or logs.

For API chat, POST `/api/agent` with `repo`, `task`, `provider`, `model`, `api_key`, optional `files`, `history`, and `mode`. This BYOK prototype is not a production multi-tenant credential management system.

## Hosting
Deploy as a Render Blueprint from `render.yaml` or another Docker host. The blueprint requests a free instance, but free-tier eligibility varies. No model weights are downloaded; inference is provided by your chosen API provider.

See [ROADMAP.md](ROADMAP.md) for milestones toward full code execution, autonomous PRs, CI/CD repair and the Creative Agent.
