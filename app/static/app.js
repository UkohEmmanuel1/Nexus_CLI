(() => {
'use strict';
const $ = id => document.getElementById(id);
const defaults = {
  openai: 'gpt-4.1-mini', deepseek: 'deepseek-chat', groq: 'openai/gpt-oss-120b',
  openrouter: 'openai/gpt-oss-120b', huggingface: 'deepseek-ai/DeepSeek-V4-Pro:novita',
  gemini: 'gemini-2.5-flash'
};
let config = null; // Session-only, never localStorage or cookies
let repo = ''; let paths = []; let selected = ''; let chatHistory = []; let busy = false;
const fmt = val => String(val ?? '');
const setStatus = value => { $('statusText').textContent = value; };
const showMessage = (kind, text) => {
  const container = document.createElement('div');
  container.className = kind === 'user' ? 'user-message' : 'assistant-message';
  if (kind !== 'user') { const avatar = document.createElement('div'); avatar.className = 'avatar'; avatar.textContent = '✦'; container.append(avatar); }
  const bubble = document.createElement('div'); bubble.className = 'bubble';
  const pre = document.createElement('pre'); pre.textContent = fmt(text);
  bubble.append(pre); container.append(bubble); $('messages').append(container);
  $('messages').scrollTop = $('messages').scrollHeight;
};
const currentConfig = () => {
  $('activeModel').textContent = config ? config.model : 'Not configured';
  $('connection').textContent = config ? '● ' + config.provider + ' connected' : '● No model configured';
  $('connection').classList.toggle('ready', !!config);
};
function openSettings() {
  $('settingsOverlay').classList.remove('hidden'); $('savedMsg').textContent = '';
  if (config) { $('provider').value = config.provider; $('model').value = config.model; $('apiKey').value = config.key; }
  else if (!$('model').value) $('model').value = defaults[$('provider').value];
  $('provider').focus();
}
function closeSettings() { $('settingsOverlay').classList.add('hidden'); }
['navSettings','topSettings','changeModel','welcomeSettings'].forEach(id => $(id)?.addEventListener('click', openSettings));
$('closeSettings').addEventListener('click', closeSettings);
$('settingsOverlay').addEventListener('click', e => { if (e.target === $('settingsOverlay')) closeSettings(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSettings(); });
$('provider').addEventListener('change', () => { $('model').value = defaults[$('provider').value]; });
$('toggleKey').addEventListener('click', () => {
  const field = $('apiKey'); field.type = field.type === 'password' ? 'text' : 'password';
  $('toggleKey').textContent = field.type === 'password' ? 'Show' : 'Hide';
});
$('settingsForm').addEventListener('submit', e => {
  e.preventDefault(); const key = $('apiKey').value.trim();
  const model = $('model').value.trim();
  if (!key || !model) { $('savedMsg').textContent = 'Enter both a model identifier and an API key.'; return; }
  config = {provider: $('provider').value, model, key};
  currentConfig(); $('savedMsg').textContent = 'Saved in this tab until you reload or disconnect.';
  setTimeout(() => closeSettings(), 600);
});
$('disconnect').addEventListener('click', () => {
  config = null; $('apiKey').value = ''; $('savedMsg').textContent = 'Disconnected and key cleared.';
  currentConfig();
});
const views = ['engineer','creative'];
function view(name) {
  views.forEach(v => $(v).classList.toggle('hidden', v !== name));
  $('navCode').classList.toggle('active', name === 'engineer');
  $('navCreative').classList.toggle('active', name === 'creative');
  $('currentView').textContent = name === 'engineer' ? 'Software Engineer' : 'Creative Studio';
}
$('navCode').addEventListener('click', () => view('engineer'));
$('navCreative').addEventListener('click', () => view('creative'));
$('backEngineer').addEventListener('click', () => view('engineer'));
$('loadRepo').addEventListener('click', loadRepo);
$('openRepoButton').addEventListener('click', loadRepo);
$('repository').addEventListener('keydown', e => { if(e.key === 'Enter') loadRepo(); });
async function loadRepo() {
  const name = $('repository').value.trim().replace(/^https?:\/\/github.com\//i,'').replace(/\/$/,'');
  $('repoError').textContent = '';
  $('filetree').textContent = 'Loading repository...'; setStatus('Connecting to GitHub');
  try {
    const response = await fetch('/api/repo?repo=' + encodeURIComponent(name));
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Unable to load repository');
    repo = data.name; paths = data.paths; selected = '';
    $('repoName').textContent = repo; $('repoStatus').textContent = data.branch + ' · ' + (data.language || 'Unknown');
    $('fileCount').textContent = paths.length + (data.truncated ? '+' : '');
    $('filename').textContent = 'Welcome'; $('filemeta').textContent = 'Read-only preview';
    renderFileTree();
    setStatus('Repository loaded');
  } catch (error) {
    $('repoError').textContent = error.message;
    $('filetree').textContent = ''; setStatus('Repository unavailable');
  }
}
function renderFileTree() {
  const root = $('filetree'); root.replaceChildren();
  if (!paths.length) { root.textContent = 'No files found.'; return; }
  const fragment = document.createDocumentFragment();
  paths.forEach(path => {
    const button = document.createElement('button'); button.className = 'fileitem';
    button.title = path;
    const glyph = document.createElement('span'); glyph.className = 'fileglyph'; glyph.textContent = '◇';
    const name = document.createElement('span'); name.textContent = path;
    button.append(glyph, name); button.addEventListener('click', () => openFile(path, button)); fragment.append(button);
  });
  root.append(fragment);
}
async function openFile(path, button) {
  selected = path;
  document.querySelectorAll('.fileitem').forEach(b => b.classList.remove('selected'));
  button.classList.add('selected');
  $('filename').textContent = path.split('/').pop();
  $('filemeta').textContent = path;
  $('editorbody').replaceChildren();
  const code = document.createElement('pre'); code.textContent = 'Loading ' + path + '...'; $('editorbody').append(code);
  try {
    const response = await fetch('/api/file?repo=' + encodeURIComponent(repo) + '&path=' + encodeURIComponent(path));
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'File unavailable');
    if (selected === path) { code.textContent = data.content; setStatus('Opened ' + path); }
  } catch(error) { code.textContent = 'Unable to open file: ' + error.message; }
}
$('clearChat').addEventListener('click', () => { chatHistory = []; $('messages').replaceChildren(); showMessage('assistant','Conversation cleared. How can I help with your code?'); });
$('prompt').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
$('send').addEventListener('click', send);
async function send() {
  if (busy) return;
  const text = $('prompt').value.trim(); if (!text) return;
  if (!config) { openSettings(); $('savedMsg').textContent = 'Configure your API key before using the coding agent.'; return; }
  if (!repo) { $('repoError').textContent = 'Load a public GitHub repository first.'; $('repository').focus(); return; }
  busy = true; $('send').disabled = true; $('prompt').value = ''; showMessage('user', text);
  showMessage('assistant', 'Working on your request...'); const loading = $('messages').lastElementChild;
  setStatus('Contacting ' + config.provider);
  try {
    const payload = {repo, task:text, provider:config.provider, model:config.model, api_key:config.key,
      files: selected && $('includeCurrent').checked ? [selected] : [], mode:$('mode').value, history:chatHistory};
    const response = await fetch('/api/agent', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Model call failed');
    loading.remove(); showMessage('assistant', data.answer);
    chatHistory.push({role:'user',content:text},{role:'assistant',content:data.answer});
    chatHistory = chatHistory.slice(-8); setStatus('Draft ready · not executed');
  } catch(error) { loading.remove(); showMessage('assistant', 'Request failed: ' + error.message); setStatus('Error'); }
  finally { busy = false; $('send').disabled = false; }
}
currentConfig();
})();