const API_BASE = '/api';

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseJson(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

export async function getAiStatus() {
  const res = await fetch(`${API_BASE}/ai/status`);
  if (!res.ok) throw new Error('Не удалось проверить статус ИИ');
  return res.json();
}

export async function generateFlyerAI(payload) {
  const res = await fetch(`${API_BASE}/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function register(email, password, name) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  return parseJson(res);
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseJson(res);
}

export async function logout(token) {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return parseJson(res);
}

export async function getMe(token) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders(token),
  });
  return parseJson(res);
}

export async function listProjects(token) {
  const res = await fetch(`${API_BASE}/projects`, {
    headers: authHeaders(token),
  });
  return parseJson(res);
}

export async function getProject(token, id) {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    headers: authHeaders(token),
  });
  return parseJson(res);
}

export async function createProject(token, body) {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function updateProject(token, id, flyer) {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(flyer),
  });
  return parseJson(res);
}

export async function deleteProject(token, id) {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return parseJson(res);
}

export async function getProjectHistory(token, id) {
  const res = await fetch(`${API_BASE}/projects/${id}/history`, {
    headers: authHeaders(token),
  });
  return parseJson(res);
}

export async function listTemplates(token, category) {
  const q = category ? `?category=${encodeURIComponent(category)}` : '';
  const res = await fetch(`${API_BASE}/templates${q}`, {
    headers: authHeaders(token),
  });
  return parseJson(res);
}

export async function saveUserTemplate(token, body) {
  const res = await fetch(`${API_BASE}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  return parseJson(res);
}
