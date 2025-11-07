// ====== Config ======
const BASE_URL = "http://localhost:8082";
const API = `${BASE_URL}/api/v1`;
const STORAGE_TOKEN = "token";
const STORAGE_PROFILE = "wellnessProfile";
const STORAGE_NAMES_PREFIX = "wellnessProfileName:";

// Endpoints de recursos
const RESOURCES_PUBLIC_URL = `${API}/resources/public`;
const RESOURCES_ADMIN_URL  = `${API}/resources`;

// ====== Referencias UI ======
const elements = {
  // auth
  loginForm: document.getElementById("loginForm"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  loginStatus: document.getElementById("loginStatus"),
  registerForm: document.getElementById("registerForm"),
  registerStatus: document.getElementById("registerStatus"),

  // dashboard
  dashboardGreeting: document.getElementById("dashboardGreeting"),
  dashboardDate: document.getElementById("dashboardDate"),
  btnLogout: document.getElementById("btnLogout"),
  btnStartGad7: document.getElementById("btnStartGad7"),
  btnStartPhq9: document.getElementById("btnStartPhq9"),
  btnOpenHistory: document.getElementById("btnOpenHistory"),
  btnCloseHistory: document.getElementById("btnCloseHistory"),
  historyPanel: document.getElementById("historyPanel"),
  historyList: document.getElementById("historyList"),

  // assessment
  btnBackToDashboard: document.getElementById("btnBackToDashboard"),
  assessmentTitle: document.getElementById("assessmentTitle"),
  assessmentStep: document.getElementById("assessmentStep"),
  assessmentProgress: document.getElementById("assessmentProgress"),
  questionCard: document.getElementById("questionCard"),
  btnPrevQuestion: document.getElementById("btnPrevQuestion"),
  btnNextQuestion: document.getElementById("btnNextQuestion"),

  // results
  resultTitle: document.getElementById("resultTitle"),
  resultSummary: document.getElementById("resultSummary"),
  resultDetails: document.getElementById("resultDetails"),
  resultAnalytics: document.getElementById("resultAnalytics"),
  resultAnswersChart: document.getElementById("resultAnswersChart"),
  resultAverage: document.getElementById("resultAverage"),
  resultMax: document.getElementById("resultMax"),
  resultFocus: document.getElementById("resultFocus"),
  btnResultDashboard: document.getElementById("btnResultDashboard"),
  btnResultHistory: document.getElementById("btnResultHistory"),

  // insights
  insightsPanel: document.getElementById("insightsPanel"),
  cardGad7: document.getElementById("cardGad7"),
  cardPhq9: document.getElementById("cardPhq9"),
  chartGad7: document.getElementById("chartGad7"),
  chartPhq9: document.getElementById("chartPhq9"),
  gadCount: document.getElementById("gadCount"),
  gadAverage: document.getElementById("gadAverage"),
  gadTrend: document.getElementById("gadTrend"),
  gadLast: document.getElementById("gadLast"),
  phqCount: document.getElementById("phqCount"),
  phqAverage: document.getElementById("phqAverage"),
  phqTrend: document.getElementById("phqTrend"),
  phqLast: document.getElementById("phqLast"),

  // help
  toast: document.getElementById("toast"),
  helpFab: document.getElementById("helpFab"),
  helpPanel: document.getElementById("helpPanel"),
  helpBackdrop: document.getElementById("helpBackdrop"),
  helpClose: document.getElementById("helpClose"),
  introPanel: document.getElementById("introPanel"),
  coachingPanel: document.getElementById("coachingPanel"),
  openIntro: document.getElementById("openIntro"),
  openCoaching: document.getElementById("openCoaching"),

  // admin
  btnOpenAdmin: document.getElementById("btnOpenAdmin"),
  btnBackFromAdmin: document.getElementById("btnBackFromAdmin"),
  jwtPayload: document.getElementById("jwtPayload"),
  btnRefreshPayload: document.getElementById("btnRefreshPayload"),

  // resources
  btnOpenResources: document.getElementById("btnOpenResources"),
  btnBackFromResources: document.getElementById("btnBackFromResources"),
  resourcesList: document.getElementById("resourcesList"),
  resourceUploader: document.getElementById("resourceUploader"),
  formResourceUpload: document.getElementById("formResourceUpload"),
  resTitle: document.getElementById("resTitle"),
  resDesc: document.getElementById("resDesc"),
  resCat: document.getElementById("resCat"),
  resFile: document.getElementById("resFile"),
  resUploadStatus: document.getElementById("resUploadStatus"),

  // comunidad (próximamente)
  btnComingSoon: document.getElementById("btnComingSoon"),
  btnBackFromComingSoon: document.getElementById("btnBackFromComingSoon"),

};

let currentUser = null;
let currentAssessment = null;
let cachedHistory = [];

// ====== Util ======
function showView(id) {
  // Oculta todas las vistas y quita el flag de activa
  document.querySelectorAll('.view').forEach(v => {
    v.classList.add('hidden');
    v.classList.remove('view--active');
  });

  // Muestra la vista destino y márcala como activa
  const view = document.getElementById(id);
  if (view) {
    view.classList.remove('hidden');
    view.classList.add('view--active');
  } else {
    // fallback defensivo: vuelve al login si no existe la vista
    const login = document.getElementById('view-login');
    if (login) {
      login.classList.remove('hidden');
      login.classList.add('view--active');
    }
  }
}

function getToken() { return localStorage.getItem(STORAGE_TOKEN) || ""; }
function setToken(t) { localStorage.setItem(STORAGE_TOKEN, t); }
function clearToken() { localStorage.removeItem(STORAGE_TOKEN); }
function storeProfile(p) { localStorage.setItem(STORAGE_PROFILE, JSON.stringify(p)); }
function loadStoredProfile() {
  const raw = localStorage.getItem(STORAGE_PROFILE);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function clearProfile() { localStorage.removeItem(STORAGE_PROFILE); }
function storeDisplayName(email, name) {
  if (!email || !name) return;
  localStorage.setItem(STORAGE_NAMES_PREFIX + email.toLowerCase(), name);
}
function getDisplayName(email) {
  if (!email) return "";
  return localStorage.getItem(STORAGE_NAMES_PREFIX + email.toLowerCase()) || email.split("@")[0];
}
function setStatus(el, message, type) {
  if (!el) return;
  el.textContent = message || "";
  el.classList.remove("is-error", "is-success");
  if (type === "error") el.classList.add("is-error");
  if (type === "success") el.classList.add("is-success");
}
function showToast(message, duration = 3000) {
  if (!elements.toast) return;
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  setTimeout(() => elements.toast.classList.remove("is-visible"), duration);
}
function formatToday() {
  const now = new Date();
  return new Intl.DateTimeFormat("es-GT", { weekday: "long", day: "numeric", month: "long" }).format(now);
}
function decodeJwtPayload(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch { return null; }
}
function decodeJwtRole(token) {
  const p = decodeJwtPayload(token);
  return p && p.role ? String(p.role) : null;
}

// ====== Auth bootstrap ======
function ensureAuth() {
  const token = getToken();
  const profile = loadStoredProfile();
  if (token && profile) {
    currentUser = profile;
    updateDashboard();
    updateAdminVisibility();
    showView("view-dashboard");
    loadHistory();
  } else {
    showView("view-login");
    cachedHistory = [];
    renderInsights([]);
  }
}
function updateDashboard() {
  if (!currentUser) return;
  elements.dashboardGreeting && (elements.dashboardGreeting.textContent = `Hola, ${currentUser.name}`);
  elements.dashboardDate && (elements.dashboardDate.textContent = formatToday());
}
function updateAdminVisibility() {
  const isAdmin = currentUser && currentUser.role === "ADMIN";
  elements.btnOpenAdmin && elements.btnOpenAdmin.classList.toggle("hidden", !isAdmin);
}

// ====== fetch helper ======
async function fetchJson(url, { method="GET", headers={}, body, auth=false, timeoutMs=10000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  const finalHeaders = { ...headers };
  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }
  if (body && !finalHeaders["Content-Type"]) finalHeaders["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(url, { method, headers: finalHeaders, body, signal: controller.signal });
  } finally { clearTimeout(t); }

  if (res.status === 401) { clearToken(); clearProfile(); }
  const text = await res.text();
  const json = text ? ( (() => { try { return JSON.parse(text); } catch { return null; } })() ) : null;
  if (!res.ok) {
    const msg = (json && (json.message || json.error)) || text || `Error ${res.status}`;
    throw new Error(msg);
  }
  return json ?? {};
}

// ====== API ======
function apiLogin(email, password) {
  return fetchJson(`${API}/auth/login`, { method: "POST", body: JSON.stringify({ email, password }) });
}
function apiRegister(email, password) {
  return fetchJson(`${API}/auth/register`, { method: "POST", body: JSON.stringify({ email, password }) });
}
function apiGad7(answers, options={}) {
  const payload = { answers, ...(typeof options.save === "boolean" ? {save: options.save} : {}), ...(options.notes ? {notes: options.notes} : {}) };
  return fetchJson(`${API}/assessments/gad7`, { method: "POST", auth: true, body: JSON.stringify(payload) });
}
function apiPhq9(answers, options={}) {
  const payload = { answers, ...(typeof options.save === "boolean" ? {save: options.save} : {}), ...(options.notes ? {notes: options.notes} : {}) };
  return fetchJson(`${API}/assessments/phq9`, { method: "POST", auth: true, body: JSON.stringify(payload) });
}
function apiHistory() {
  return fetchJson(`${API}/assessments/history`, { auth: true });
}

// ====== Datos de cuestionarios ======
const OPTION_SET = [
  { label: "Nunca", value: 0 },
  { label: "Varios días", value: 1 },
  { label: "Más de la mitad de los días", value: 2 },
  { label: "Casi todos los días", value: 3 },
];
const GAD7_QUESTIONS = [
  { emoji: "🙂", title: "¿Cómo te sientes hoy?", subtitle: "Tu estado de ánimo general", options: OPTION_SET, tint: "linear-gradient(160deg, #ffe9f3, #f3f4ff)" },
  { emoji: "🧠", title: "Preocupación o ansiedad", subtitle: "¿Cuánto te inquietaste por cosas diversas?", options: OPTION_SET, tint: "linear-gradient(160deg, #e8f5ff, #f3edff)" },
  { emoji: "💤", title: "Dificultad para relajarte", subtitle: "¿Te costó relajarte durante la semana?", options: OPTION_SET, tint: "linear-gradient(160deg, #fff2de, #f7edff)" },
  { emoji: "⚡", title: "Inquietud", subtitle: "¿Sentiste nerviosismo o agitación?", options: OPTION_SET, tint: "linear-gradient(160deg, #ffe8e8, #fff1f7)" },
  { emoji: "🧭", title: "Miedo o preocupación", subtitle: "¿Cuánto temiste que algo terrible pudiera suceder?", options: OPTION_SET, tint: "linear-gradient(160deg, #e9fff1, #f0f3ff)" },
  { emoji: "🌙", title: "Dificultad para dormir", subtitle: "¿Tu descanso se vio afectado por la ansiedad?", options: OPTION_SET, tint: "linear-gradient(160deg, #f0efff, #e0f7ff)" },
  { emoji: "🤝", title: "Control de tus preocupaciones", subtitle: "¿Te resultó complicado controlar tus preocupaciones?", options: OPTION_SET, tint: "linear-gradient(160deg, #fff0e6, #f5ebff)" },
];
const PHQ9_QUESTIONS = [
  { emoji: "🌤️", title: "Interés o placer", subtitle: "¿Tuviste poco interés en hacer cosas?", options: OPTION_SET, tint: "linear-gradient(160deg, #fff0e6, #f8e9ff)" },
  { emoji: "🙂", title: "Estado de ánimo", subtitle: "¿Te sentiste decaído o sin esperanza?", options: OPTION_SET, tint: "linear-gradient(160deg, #e8f4ff, #fff0f8)" },
  { emoji: "😴", title: "Sueño", subtitle: "¿Tuviste dificultades para dormir o dormiste demasiado?", options: OPTION_SET, tint: "linear-gradient(160deg, #f0f4ff, #fff3e6)" },
  { emoji: "🍽️", title: "Apetito", subtitle: "¿Tuviste poco apetito o comiste en exceso?", options: OPTION_SET, tint: "linear-gradient(160deg, #fff0f5, #edf6ff)" },
  { emoji: "💨", title: "Energía", subtitle: "¿Te sentiste cansado o con poca energía?", options: OPTION_SET, tint: "linear-gradient(160deg, #f4e9ff, #fff4ea)" },
  { emoji: "🤔", title: "Autoestima", subtitle: "¿Te sentiste mal contigo o que eres un fracaso?", options: OPTION_SET, tint: "linear-gradient(160deg, #f0ffef, #f4ebff)" },
  { emoji: "🧠", title: "Concentración", subtitle: "¿Tuviste problemas para concentrarte?", options: OPTION_SET, tint: "linear-gradient(160deg, #e8f9ff, #f5f0ff)" },
  { emoji: "🚶", title: "Movimiento o lentitud", subtitle: "¿Te notaron inquieto o demasiado lento?", options: OPTION_SET, tint: "linear-gradient(160deg, #ffeef2, #eef6ff)" },
  { emoji: "❤️", title: "Pensamientos", subtitle: "¿Pensaste que estarías mejor muerto o lastimándote?", options: OPTION_SET, tint: "linear-gradient(160deg, #ffe8e8, #fff4f7)" },
];

// ====== Flujo de evaluación ======
function startAssessment(type) {
  const dataset = type === "phq9" ? PHQ9_QUESTIONS : GAD7_QUESTIONS;
  currentAssessment = {
    type,
    questions: dataset,
    answers: Array(dataset.length).fill(undefined),
    index: 0,
    title: type === "phq9" ? "Resultados PHQ-9" : "Check-in de Bienestar (GAD-7)",
  };
  renderAssessment();
  showView("view-assessment");
}

function renderAssessment() {
  if (!currentAssessment) return;
  const { questions, index, title, answers } = currentAssessment;
  const q = questions[index];

  elements.assessmentTitle.textContent = title;
  elements.assessmentStep.textContent = `Pregunta ${index + 1} de ${questions.length}`;
  elements.assessmentProgress.style.width = `${((index + 1) / questions.length) * 100}%`;

  elements.questionCard.innerHTML = "";
  elements.questionCard.style.background = q.tint || "";
  elements.questionCard.style.color = q.textColor || "var(--text-primary)";

  const header = document.createElement("div");
  header.className = "question-header";
  const emoji = document.createElement("div");
  emoji.className = "question-emoji";
  emoji.textContent = q.emoji || "😊";
  const titleEl = document.createElement("h3");
  titleEl.className = "question-title";
  titleEl.textContent = q.title;
  const subtitleEl = document.createElement("p");
  subtitleEl.className = "question-subtitle";
  subtitleEl.textContent = q.subtitle || "";
  header.append(emoji, titleEl, subtitleEl);
  elements.questionCard.append(header);

  if (q.options) {
    const list = document.createElement("div");
    list.className = "option-list";
    q.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-button";
      btn.textContent = opt.label;
      if (answers[index] === opt.value) btn.classList.add("is-selected");
      btn.addEventListener("click", () => {
        currentAssessment.answers[index] = opt.value;
        renderAssessment();
        updateAssessmentControls();
      });
      list.append(btn);
    });
    elements.questionCard.append(list);
  }
  updateAssessmentControls();
}

function updateAssessmentControls() {
  if (!currentAssessment) return;
  const { index, answers, questions } = currentAssessment;
  const hasAnswer = typeof answers[index] === "number";
  elements.btnPrevQuestion && (elements.btnPrevQuestion.disabled = index === 0);
  if (elements.btnNextQuestion) {
    elements.btnNextQuestion.disabled = !hasAnswer;
    elements.btnNextQuestion.textContent = index === questions.length - 1 ? "Finalizar" : "Siguiente";
  }
}

async function submitAssessment() {
  if (!currentAssessment) return;
  const { type, answers } = currentAssessment;
  const payload = answers.map(a => Number(a ?? 0));
  try {
    if (elements.btnNextQuestion) {
      elements.btnNextQuestion.disabled = true;
      elements.btnNextQuestion.textContent = "Enviando...";
    }
    const response = type === "phq9" ? await apiPhq9(payload) : await apiGad7(payload);
    showResult(response, type, payload.slice());
    currentAssessment = null;
    await loadHistory();
  } catch (e) {
    console.error(e);
    showToast("No se pudo enviar la evaluación. Inténtalo nuevamente.");
    if (elements.btnNextQuestion) {
      elements.btnNextQuestion.disabled = false;
      updateAssessmentControls();
    }
  } finally {
    const assessmentView = document.getElementById("view-assessment");
    if (elements.btnNextQuestion && assessmentView && !assessmentView.classList.contains("hidden")) {
      elements.btnNextQuestion.textContent = "Finalizar";
    }
  }
}

function showResult(result, type, answers) {
  showView("view-result");
  const isPhq = type === "phq9";
  elements.resultTitle.textContent = isPhq ? "Resultados PHQ-9" : "Resultados GAD-7";
  elements.resultSummary.textContent = `Tu puntaje total fue ${result.total} (${result.category}).`;
  elements.resultDetails.innerHTML = "";
  const items = [`Interpretación: ${result.message || "Consulta con un especialista si lo necesitas."}`];
  if (result.createdAt) items.push(`Registrado el ${new Date(result.createdAt).toLocaleString("es-GT")}`);
  items.forEach(t => { const li = document.createElement("li"); li.textContent = t; elements.resultDetails.append(li); });

  // Analítica y gráfico en <div id="resultAnswersChart">
  renderResultAnalytics(type, answers);
}

function goToDashboard() { showView("view-dashboard"); updateDashboard(); }

async function loadHistory() {
  if (!currentUser) return;
  try {
    const items = await apiHistory();
    if (!getToken()) {
      showToast("Tu sesión expiró. Inicia sesión nuevamente.");
      showView("view-login");
      cachedHistory = [];
      renderInsights([]);
      return;
    }
    cachedHistory = Array.isArray(items) ? items : [];
    renderHistory(cachedHistory);
    renderInsights(cachedHistory);
  } catch (e) {
    if (!getToken()) {
      showToast("Tu sesión expiró. Inicia sesión nuevamente.");
      showView("view-login");
      cachedHistory = [];
      renderInsights([]);
      return;
    }
    console.error(e);
    showToast("No se pudo cargar el historial.");
  }
}

function renderHistory(items) {
  if (!elements.historyList) return;
  elements.historyList.innerHTML = "";
  if (!items || !items.length) {
    const li = document.createElement("li"); li.textContent = "Aún no tienes evaluaciones registradas."; elements.historyList.append(li); return;
    }
  items.slice().reverse().forEach(item => {
    const li = document.createElement("li"); li.className = "history-item";
    const left = document.createElement("div");
    const ls = document.createElement("strong"); ls.textContent = String(item.type || "");
    const lbr = document.createElement("br");
    const lspan = document.createElement("span"); lspan.textContent = new Date(item.createdAt).toLocaleString("es-GT");
    left.append(ls, lbr, lspan);
    const right = document.createElement("div");
    const rs = document.createElement("strong"); rs.textContent = String(item.total ?? "");
    const rbr = document.createElement("br");
    const rspan = document.createElement("span"); rspan.textContent = String(item.category || "");
    right.append(rs, rbr, rspan);
    li.append(left, right);
    elements.historyList.append(li);
  });
}

// ====== Insights helpers ======
function normalizeAssessmentType(value) {
  const t = String(value || "").toLowerCase();
  if (t.includes("phq")) return "phq9";
  if (t.includes("gad")) return "gad7";
  return null;
}
function formatInsightDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-GT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}
function capitalize(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : ""; }
function formatTrend(change) {
  if (change > 0) return `↑ +${change} pts (subió)`;
  if (change < 0) return `↓ ${Math.abs(change)} pts (mejoró)`;
  return "→ Sin cambios";
}
function drawLineChart(svg, values, { max } = {}) {
  if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  if (!values || !values.length) return;

  const ns = "http://www.w3.org/2000/svg";
  const height = 40, width = 100;
  const vmax = max || Math.max(...values, 1);
  const vals = values.map(v => Math.max(0, Number(v) || 0));
  const step = vals.length > 1 ? width / (vals.length - 1) : 0;
  const pts = vals.map((v, i) => ({ x: vals.length > 1 ? i * step : width / 2, y: height - (v / vmax) * height }));

  for (let i = 1; i < 4; i++) {
    const line = document.createElementNS(ns, "line");
    const y = (height / 4) * i;
    line.setAttribute("x1", "0"); line.setAttribute("y1", y);
    line.setAttribute("x2", String(width)); line.setAttribute("y2", y);
    svg.appendChild(line);
  }
  const area = document.createElementNS(ns, "polygon");
  const areaPts = pts.length > 1 ? [[pts[0].x, height], ...pts.map(p => [p.x, p.y]), [pts[pts.length - 1].x, height]] : [[0, height], [pts[0].x, pts[0].y], [width, height]];
  area.setAttribute("points", areaPts.map(p => `${p[0]},${p[1]}`).join(" "));
  svg.appendChild(area);

  const poly = document.createElementNS(ns, "polyline");
  poly.setAttribute("points", pts.map(p => `${p.x},${p.y}`).join(" "));
  svg.appendChild(poly);

  pts.forEach(p => {
    const c = document.createElementNS(ns, "circle");
    c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); c.setAttribute("r", 1.8);
    svg.appendChild(c);
  });
}

function renderInsightCard(key, data) {
  const isGad = key === "gad7";
  const card = isGad ? elements.cardGad7 : elements.cardPhq9;
  const chart = isGad ? elements.chartGad7 : elements.chartPhq9;
  const countEl = isGad ? elements.gadCount : elements.phqCount;
  const averageEl = isGad ? elements.gadAverage : elements.phqAverage;
  const trendEl = isGad ? elements.gadTrend : elements.phqTrend;
  const lastEl = isGad ? elements.gadLast : elements.phqLast;
  if (!card) return;

  if (!data || !data.length) {
    card.classList.add("insight-card--empty");
    if (chart) chart.innerHTML = "";
    if (countEl) countEl.textContent = "0";
    if (averageEl) averageEl.textContent = "0";
    if (trendEl) trendEl.textContent = "—";
    if (lastEl) lastEl.textContent = isGad
      ? "Cuando completes evaluaciones verás aquí el detalle más reciente."
      : "Tus resultados más recientes aparecerán aquí al completar evaluaciones.";
    return;
  }

  card.classList.remove("insight-card--empty");
  const sorted = data.slice().sort((a,b) => new Date(a.createdAt||a.date||0) - new Date(b.createdAt||b.date||0));
  const totalCount = sorted.length;
  const chartValues = sorted.slice(-8).map(i => Number(i.total) || 0);
  const avg = sorted.reduce((acc, v) => acc + (Number(v.total)||0), 0) / sorted.length;
  const last = sorted[sorted.length-1];
  const prev = sorted.length > 1 ? sorted[sorted.length-2] : null;
  const change = prev ? (Number(last.total)||0) - (Number(prev.total)||0) : 0;

  if (chart) drawLineChart(chart, chartValues, { max: isGad ? 21 : 27 });
  if (countEl) countEl.textContent = String(totalCount);
  if (averageEl) averageEl.textContent = avg.toFixed(1);
  if (trendEl) trendEl.textContent = totalCount > 1 ? formatTrend(Math.round(change)) : "→ Sin cambios";
  if (lastEl) {
    const category = capitalize(last.category || "");
    const dateText = formatInsightDate(last.createdAt || last.date);
    const pieces = [`Último: ${last.total}`];
    if (category) pieces.push(`(${category})`);
    if (dateText) pieces.push(`· ${dateText}`);
    lastEl.textContent = pieces.join(" ");
  }
}

function renderInsights(items=[]) {
  if (!elements.insightsPanel) return;
  const grouped = { gad7: [], phq9: [] };
  items.forEach(it => {
    const n = normalizeAssessmentType(it.type);
    if (!n) return;
    grouped[n].push({ total: Number(it.total)||0, category: it.category, createdAt: it.createdAt });
  });
  renderInsightCard("gad7", grouped.gad7);
  renderInsightCard("phq9", grouped.phq9);
}

// ====== Eventos auth / navegación ======
elements.loginForm && elements.loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = elements.loginEmail.value.trim();
  const password = elements.loginPassword.value;
  setStatus(elements.loginStatus, "Iniciando sesión...");
  try {
    const data = await apiLogin(email, password);
    setToken(data.token);
    const name = getDisplayName(data.email);
    const role = data.role || decodeJwtRole(data.token) || "USER";
    currentUser = { email: data.email, userId: data.userId, name, role };
    storeProfile(currentUser);
    updateDashboard();
    updateAdminVisibility();
    showToast("¡Bienvenido de vuelta!");
    showView("view-dashboard");
    loadHistory();
    elements.loginForm.reset();
    setStatus(elements.loginStatus, "", null);
  } catch (err) {
    console.error(err);
    setStatus(elements.loginStatus, `No se pudo iniciar sesión: ${err.message || "Error desconocido"}`, "error");
  }
});

elements.registerForm && elements.registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirm = document.getElementById("registerConfirm").value;
  const name = document.getElementById("registerName").value.trim();
  if (password !== confirm) { setStatus(elements.registerStatus, "Las contraseñas no coinciden.", "error"); return; }
  setStatus(elements.registerStatus, "Creando cuenta...");
  try {
    await apiRegister(email, password);
    if (name) storeDisplayName(email, name);
    setStatus(elements.registerStatus, "Cuenta creada. Ahora puedes iniciar sesión.", "success");
    elements.registerForm.reset();
    setTimeout(() => { showView("view-login"); setStatus(elements.registerStatus, "", null); }, 1200);
  } catch (err) {
    console.error(err);
    setStatus(elements.registerStatus, "No se pudo registrar. ¿El correo ya existe?", "error");
  }
});

Array.from(document.querySelectorAll("[data-switch]")).forEach(btn => {
  btn.addEventListener("click", () => showView(btn.getAttribute("data-switch")==="register" ? "view-register" : "view-login"));
});

elements.btnLogout && elements.btnLogout.addEventListener("click", () => {
  clearToken(); clearProfile(); currentUser = null; cachedHistory = [];
  renderInsights([]); elements.historyPanel?.classList.add("hidden");
  showView("view-login"); showToast("Sesión cerrada.");
});

elements.btnStartGad7 && elements.btnStartGad7.addEventListener("click", () => startAssessment("gad7"));
elements.btnStartPhq9 && elements.btnStartPhq9.addEventListener("click", () => startAssessment("phq9"));

elements.btnBackToDashboard && elements.btnBackToDashboard.addEventListener("click", () => {
  if (!currentAssessment) { showView("view-dashboard"); return; }
  const hasProgress = currentAssessment.answers.some(a => typeof a === "number");
  if (!hasProgress || confirm("¿Deseas salir de la evaluación actual?")) {
    currentAssessment = null; showView("view-dashboard");
  }
});

elements.btnPrevQuestion && elements.btnPrevQuestion.addEventListener("click", () => {
  if (!currentAssessment || currentAssessment.index===0) return;
  currentAssessment.index--; renderAssessment();
});
elements.btnNextQuestion && elements.btnNextQuestion.addEventListener("click", () => {
  if (!currentAssessment) return;
  const { index, questions, answers } = currentAssessment;
  if (typeof answers[index] !== "number") return;
  if (index === questions.length - 1) submitAssessment(); else { currentAssessment.index++; renderAssessment(); }
});

elements.btnOpenHistory && elements.btnOpenHistory.addEventListener("click", () => { elements.historyPanel?.classList.remove("hidden"); loadHistory(); });
elements.btnCloseHistory && elements.btnCloseHistory.addEventListener("click", () => elements.historyPanel?.classList.add("hidden"));
elements.btnResultDashboard && elements.btnResultDashboard.addEventListener("click", () => goToDashboard());
elements.btnResultHistory && elements.btnResultHistory.addEventListener("click", () => { goToDashboard(); elements.historyPanel?.classList.remove("hidden"); });

// ====== Ayuda ======
let _helpLastFocus = null;
function openHelp() {
  if (!elements.helpPanel) return;
  _helpLastFocus = document.activeElement;
  elements.helpBackdrop.hidden = false;
  elements.helpPanel.hidden = false;
  (elements.helpPanel.querySelector("#helpTitle") || elements.helpPanel).focus?.();
  elements.helpPanel.scrollTop = 0;
}
function closeHelp() {
  if (!elements.helpPanel) return;
  elements.helpBackdrop.hidden = true;
  elements.helpPanel.hidden = true;
  _helpLastFocus?.focus?.();
}
elements.helpFab && elements.helpFab.addEventListener("click", openHelp);
elements.helpClose && elements.helpClose.addEventListener("click", closeHelp);
elements.helpBackdrop && elements.helpBackdrop.addEventListener("click", closeHelp);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && elements.helpPanel && !elements.helpPanel.hidden) closeHelp(); });
// mini-panels
function openPanel(panel){ elements.helpBackdrop.hidden = false; panel.hidden = false; panel.scrollTop = 0; }
function closeAllPanels(){ elements.helpBackdrop.hidden = true; elements.helpPanel.hidden = true; elements.introPanel.hidden = true; elements.coachingPanel.hidden = true; }
elements.openIntro?.addEventListener("click", () => { closeAllPanels(); openPanel(elements.introPanel); });
elements.openCoaching?.addEventListener("click", () => { closeAllPanels(); openPanel(elements.coachingPanel); });
document.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", closeAllPanels));

// ====== Admin ======
elements.btnOpenAdmin && elements.btnOpenAdmin.addEventListener("click", () => { renderJwtPayload(); showView("view-admin"); });
elements.btnBackFromAdmin && elements.btnBackFromAdmin.addEventListener("click", () => showView("view-dashboard"));
elements.btnRefreshPayload && elements.btnRefreshPayload.addEventListener("click", () => { renderJwtPayload(); showToast("Payload actualizado"); });
function renderJwtPayload() {
  if (!elements.jwtPayload) return;
  const payload = decodeJwtPayload(getToken());
  elements.jwtPayload.textContent = payload ? JSON.stringify(payload, null, 2) : "—";
}
const promoteForm = document.getElementById("formPromote");
if (promoteForm) {
  promoteForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = Number(document.getElementById("promoteUserId").value);
    const status = document.getElementById("promoteStatus");
    setStatus(status, "Promoviendo...");
    try {
      const res = await fetch(`${API}/users/${id}/make-admin`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
      setStatus(status, `Usuario ${id} promovido a ADMIN ✔`, "success");
      showToast("Promoción exitosa");
    } catch (err) {
      console.error(err);
      setStatus(status, "No se pudo promover: verifica token ADMIN y el ID.", "error");
    }
  });
}

// ====== Recursos ======
async function apiResourcesList() {
  let res;
  try {
    res = await fetch(RESOURCES_PUBLIC_URL, { headers: { "Accept": "application/json" } });
  } catch (e) {
    console.error("[resources] Error de red:", e);
    throw new Error("NETWORK");
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("[resources] HTTP", res.status, txt);
    throw new Error(String(res.status));
  }

  try {
    return await res.json();
  } catch (e) {
    const body = await res.clone().text().catch(() => "");
    console.error("[resources] JSON inválido. Body:", body);
    throw new Error("BAD_JSON");
  }
}
async function apiResourceCreate({ title, description, category, file }) {
  const token = getToken();
  if (!token) throw new Error("Necesitas iniciar sesión");
  const fd = new FormData();
  fd.append("title", title);
  if (description) fd.append("description", description);
  if (category) fd.append("category", category);
  if (file) fd.append("file", file);
  const res = await fetch(RESOURCES_ADMIN_URL, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
  if (res.status === 401 || res.status === 403) throw new Error("No autorizado para crear recursos");
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("[resources] create HTTP", res.status, txt);
    throw new Error("Error al crear recurso");
  }
  return res.json();
}
async function apiResourceDelete(id) {
  const token = getToken();
  if (!token) throw new Error("Necesitas iniciar sesión");
  const res = await fetch(`${RESOURCES_ADMIN_URL}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401 || res.status === 403) throw new Error("No autorizado para eliminar");
  if (res.status !== 204 && !res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("[resources] delete HTTP", res.status, txt);
    throw new Error("Error al eliminar recurso");
  }
}

function openResourcesView() {
  showView("view-resources");
  const isAdmin = currentUser && currentUser.role === "ADMIN";
  elements.resourceUploader && elements.resourceUploader.classList.toggle("hidden", !isAdmin);
  loadAndRenderResources();
}
async function loadAndRenderResources() {
  try {
    const items = await apiResourcesList();
    renderResources(items);
  } catch (e) {
    if (e.message === "NETWORK") {
      showToast("No hay conexión con el API de recursos.");
    } else if (e.message === "BAD_JSON") {
      showToast("Respuesta inválida del servidor de recursos.");
    } else if (e.message === "403") {
      showToast("No autorizado para ver los recursos.");
    } else {
      showToast("No se pudieron cargar los recursos.");
    }
    renderResources([]);
  }
}
function renderResources(items) {
  const list = elements.resourcesList;
  if (!list) return;
  if (!items || !items.length) {
    list.innerHTML = `
      <article class="insight-card insight-card--empty">
        <header class="insight-head">
          <div>
            <h3>No hay recursos aún</h3>
            <p class="insight-subtitle">Cuando se publiquen, aparecerán aquí.</p>
          </div>
          <span class="insight-badge">Recursos</span>
        </header>
      </article>`;
    return;
  }
  list.innerHTML = items.map(r => `
    <article class="insight-card">
      <header class="insight-head">
        <div>
          <h3>${r.title ?? "Recurso"}</h3>
          <p class="insight-subtitle">${r.category ?? "General"}</p>
        </div>
        <span class="insight-badge">${r.status ?? "APPROVED"}</span>
      </header>
      <div class="insight-body">
        <p>${r.description ?? ""}</p>
        ${r.fileUrl ? `<a class="btn btn--light" href="${BASE_URL}${r.fileUrl}" target="_blank" rel="noopener">Abrir archivo</a>` : ""}
        <p class="insight-last">Publicado: ${new Date(r.createdAt).toLocaleString("es-GT")}</p>
      </div>
    </article>
  `).join("");
}

// ====== Analytics de resultados para <div id="resultAnswersChart"> ======
function renderResultAnalytics(type, answers) {
  // Reset seguro
  elements.resultAverage && (elements.resultAverage.textContent = "-");
  elements.resultMax && (elements.resultMax.textContent = "-");
  elements.resultFocus && (elements.resultFocus.textContent = "-");
  if (elements.resultAnswersChart) elements.resultAnswersChart.innerHTML = "";

  if (!Array.isArray(answers) || !answers.length) return;

  const vals = answers.map(v => Number(v) || 0);  // 0..3
  const total = vals.reduce((a,b)=>a+b,0);
  const avg = (total / vals.length).toFixed(2);
  const max = Math.max(...vals);

  elements.resultAverage && (elements.resultAverage.textContent = String(avg));
  elements.resultMax && (elements.resultMax.textContent = String(max));

  // Foco
  const maxIdxs = vals.map((v,i)=>({v,i})).filter(x=>x.v===max).map(x=>x.i+1);
  const scale = type==="phq9" ? "PHQ-9" : "GAD-7";
  if (elements.resultFocus) {
    elements.resultFocus.textContent = max > 0
      ? `Puntos a observar (${scale}): pregunta(s) ${maxIdxs.join(", ")} con ${max}.`
      : "Sin focos marcados (todas ≤ 0).";
  }

  // Gráfico de barras dentro del DIV (sin canvas ni librerías)
  const container = elements.resultAnswersChart;
  if (!container) return;

  // Estilos base del contenedor (por si CSS no los define)
  container.style.display = "grid";
  container.style.gridTemplateColumns = `repeat(${vals.length}, 1fr)`;
  container.style.gap = "8px";
  container.style.alignItems = "end";
  container.style.height = "140px";

  const maxVal = Math.max(1, max);
  vals.forEach((v, i) => {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "flex-end";
    wrapper.style.height = "100%";

    const bar = document.createElement("div");
    const hPct = (v / maxVal) * 100;
    bar.style.height = `${Math.max(4, Math.round(hPct))}%`;
    bar.style.width = "100%";
    bar.style.minWidth = "10px";
    bar.style.borderRadius = "8px";
    bar.style.background = "#6aa9ff";
    bar.style.boxShadow = "0 1px 2px rgba(0,0,0,.06)";

    const value = document.createElement("div");
    value.textContent = String(v);
    value.style.fontSize = "12px";
    value.style.color = "#333";
    value.style.marginBottom = "4px";

    const label = document.createElement("div");
    label.textContent = `P${i+1}`;
    label.style.fontSize = "11px";
    label.style.color = "#666";
    label.style.marginTop = "6px";

    wrapper.append(value, bar, label);
    container.appendChild(wrapper);
  });
}

// ====== Binds de recursos ======
elements.btnOpenResources && elements.btnOpenResources.addEventListener("click", openResourcesView);
elements.btnBackFromResources && elements.btnBackFromResources.addEventListener("click", () => showView("view-dashboard"));
elements.btnComingSoon?.addEventListener("click", () => showView("view-comingsoon"));
elements.btnBackFromComingSoon?.addEventListener("click", () => showView("view-dashboard"));


// ====== Uploader ADMIN ======
if (elements.formResourceUpload) {
  elements.formResourceUpload.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = elements.resTitle?.value.trim();
    const description = elements.resDesc?.value.trim();
    const category = elements.resCat?.value.trim();
    const file = elements.resFile?.files[0];
    const status = elements.resUploadStatus;

    if (!title) { setStatus(status, "Título requerido", "error"); return; }
    setStatus(status, "Publicando...");
    try {
      await apiResourceCreate({ title, description, category, file });
      elements.formResourceUpload.reset();
      setStatus(status, "Publicado ✔", "success");
      loadAndRenderResources();
    } catch (err) {
      console.error(err);
      setStatus(status, "No se pudo publicar", "error");
    }
  });
}

// ====== Inicio ======
ensureAuth();
