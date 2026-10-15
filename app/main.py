import os
import re

import httpx
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

app = FastAPI(title="Nexus CLI / Forge AI", version="0.1.0")
MODEL = os.getenv("HF_MODEL", "deepseek-ai/DeepSeek-V4-Pro:novita")


class AnalyzeRequest(BaseModel):
    repo: str = Field(min_length=3, max_length=160)
    task: str = Field(min_length=3, max_length=3000)


@app.get("/health")
def health():
    return {"status": "ok", "inference_configured": bool(os.getenv("HF_TOKEN"))}


@app.post("/api/analyze")
async def analyze(body: AnalyzeRequest, x_api_key: str | None = Header(default=None)):
    token = os.getenv("HF_TOKEN", "")
    secret = os.getenv("AGENT_API_KEY", "")
    if token:
        # Never expose paid inference on an unauthenticated public endpoint.
        import secrets
        if not secret:
            raise HTTPException(503, "Server owner must configure AGENT_API_KEY")
        if not x_api_key or not secrets.compare_digest(x_api_key, secret):
            raise HTTPException(401, "Invalid API key")

    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", body.repo):
        raise HTTPException(400, "Use owner/repository format")

    headers = {"User-Agent": "NexusCLI-ForgeAI/0.1", "Accept": "application/vnd.github+json"}
    async with httpx.AsyncClient(timeout=30, follow_redirects=False, headers=headers) as client:
        try:
            info_response = await client.get(f"https://api.github.com/repos/{body.repo}")
            if info_response.status_code != 200:
                raise HTTPException(400, f"Cannot inspect public repository (GitHub HTTP {info_response.status_code})")
            info = info_response.json()
            branch = info["default_branch"]
            tree_response = await client.get(
                f"https://api.github.com/repos/{body.repo}/git/trees/{branch}",
                params={"recursive": "1"},
            )
            if tree_response.status_code != 200:
                raise HTTPException(502, "GitHub repository tree unavailable")
            tree = tree_response.json()
            files = [entry["path"] for entry in tree.get("tree", []) if entry.get("type") == "blob"][:200]
            context = {
                "repository": body.repo,
                "description": info.get("description"),
                "primary_language": info.get("language"),
                "files": files,
                "file_list_truncated": tree.get("truncated", False),
            }
            if not token:
                return {
                    "mode": "preview",
                    "repository": context,
                    "plan": "Repository metadata loaded. Add HF_TOKEN and AGENT_API_KEY to enable AI planning.",
                    "warning": "No source files were read, tests run, or changes made.",
                }

            prompt = (
                "You are Forge AI, a software engineering planning assistant. You have ONLY "
                "repository metadata and file paths, NOT source code. Do not claim to have "
                "read files, executed tests or edited code. Return a practical stepwise plan, "
                "files to inspect, risks, and verification steps. User task: "
                + body.task + "\nRepository context: " + str(context)[:13000]
            )
            response = await client.post(
                "https://router.huggingface.co/v1/chat/completions",
                headers={"Authorization": f"Bearer {token}"},
                json={"model": MODEL, "messages": [{"role": "user", "content": prompt}], "max_tokens": 1100},
                timeout=120,
            )
            if response.status_code != 200:
                raise HTTPException(502, f"Inference provider returned HTTP {response.status_code}")
            data = response.json()
            return {
                "mode": "ai",
                "repository": context,
                "plan": data["choices"][0]["message"]["content"],
                "warning": "Planning only. No source code was read, executed, or modified.",
            }
        except httpx.RequestError as exc:
            raise HTTPException(502, "Upstream connection failed") from exc


@app.get("/", response_class=HTMLResponse)
def home():
    return """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nexus CLI — Forge AI</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#0c101b;color:#eaf0ff;font:16px system-ui}
.shell{display:grid;grid-template-columns:245px 1fr;min-height:100vh}
aside{border-right:1px solid #293244;padding:28px}
main{max-width:900px;width:100%;margin:auto;padding:50px 30px}
h1{font-size:clamp(28px,5vw,44px);letter-spacing:-1px;margin-bottom:10px}
p,small{color:#a0adc3;line-height:1.6}
.logo{font-size:23px;font-weight:800}.logo span{color:#8d9bff}
.panel{background:#161e2d;border:1px solid #303c52;border-radius:15px;padding:24px;margin:25px 0}
label{display:block;margin:15px 0 7px;color:#c4cde1;font-size:13px}
input,textarea{width:100%;background:#0d1422;border:1px solid #3a4862;border-radius:9px;padding:12px;color:white;font:inherit}
textarea{min-height:135px}button{background:#697eff;color:white;padding:13px 18px;border:0;border-radius:9px;font-weight:700;margin-top:20px;cursor:pointer}
button:disabled{opacity:.5}pre{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6}
mark{background:#243253;color:#c6d3ff;padding:5px 10px;border-radius:20px}
@media(max-width:750px){.shell{display:block}aside{padding:18px;border-bottom:1px solid #293244}main{padding:24px}}
</style></head>
<body><div class="shell"><aside><div class="logo">◆ Nexus <span>CLI</span></div>
<p>Forge AI / Engineering</p><hr style="border:0;border-top:1px solid #293244">
<small>● Repository planning<br><br>○ Sandbox execution (roadmap)<br><br>○ Creative agent (roadmap)</small></aside>
<main><mark>EARLY MVP · PLANNING ONLY</mark><h1>Turn your repository into an engineering plan.</h1>
<p>Inspect public GitHub repository metadata and request an AI-generated implementation plan. This prototype does not change code or run tests.</p>
<section class="panel"><form id="taskForm">
<label for="repo">Public GitHub repository</label><input id="repo" required value="tiangolo/fastapi" placeholder="owner/repository">
<label for="task">Engineering task</label><textarea id="task" required placeholder="Plan how to diagnose a failing CI pipeline"></textarea>
<label for="key">Agent API key (only needed when inference is enabled)</label>
<input id="key" type="password" autocomplete="off" placeholder="X-API-Key">
<button id="submit">Analyse repository →</button></form></section>
<section class="panel" id="results" hidden><h2>Engineering plan</h2><pre id="output"></pre></section>
<small>Public repositories only. Keep API tokens and secrets private. No execution or code editing in this version.</small>
</main></div><script>
const form=document.querySelector('#taskForm'),button=document.querySelector('#submit'),result=document.querySelector('#results'),out=document.querySelector('#output');
form.addEventListener('submit',async e=>{
 e.preventDefault();button.disabled=true;button.textContent='Analysing...';result.hidden=false;out.textContent='Fetching GitHub metadata...';
 try{
  const headers={'Content-Type':'application/json'};
  const key=document.querySelector('#key').value;if(key)headers['X-API-Key']=key;
  const response=await fetch('/api/analyze',{method:'POST',headers,body:JSON.stringify({repo:document.querySelector('#repo').value,task:document.querySelector('#task').value})});
  const data=await response.json();out.textContent=response.ok?data.plan+'\n\n'+data.warning:JSON.stringify(data,null,2);
 }catch(err){out.textContent=String(err)}finally{button.disabled=false;button.textContent='Analyse repository →'}
});
</script></body></html>"""
