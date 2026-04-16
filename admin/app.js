// ── Lakecode Admin — Shared JS ──

var API_URL = 'https://api.lakecode.ai';
var PROVISIONING_URL = 'https://provisioning.lakecode.ai';

// ── Auth gate ──

function requireAuth() {
  var key = localStorage.getItem('lk_key');
  if (!key) {
    showAuthGate();
    return false;
  }
  // Verify key is valid and user has admin access
  return fetch(API_URL + '/account', { headers: { 'x-api-key': key } })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.email) {
        showAuthGate('Invalid session. Please sign in again.');
        return false;
      }
      // Show admin content
      var gate = document.getElementById('auth-gate');
      if (gate) gate.style.display = 'none';
      var content = document.getElementById('admin-content');
      if (content) content.style.display = '';
      return true;
    })
    .catch(function() {
      showAuthGate('Could not verify your account. Please sign in again.');
      return false;
    });
}

function showAuthGate(msg) {
  var gate = document.getElementById('auth-gate');
  var content = document.getElementById('admin-content');
  if (content) content.style.display = 'none';
  if (gate) {
    gate.style.display = '';
    if (msg) {
      var errEl = gate.querySelector('.auth-gate-error');
      if (errEl) errEl.textContent = msg;
    }
  }
}

// ── API client ──

function apiHeaders() {
  var key = localStorage.getItem('lk_key');
  var h = { 'Content-Type': 'application/json' };
  if (key) h['Authorization'] = 'Bearer ' + key;
  return h;
}

function api(method, url, body) {
  var opts = { method: method, headers: apiHeaders() };
  if (body) opts.body = JSON.stringify(body);
  return fetch(url, opts).then(function(r) {
    if (!r.ok) return r.json().then(function(e) { throw e; });
    return r.json();
  });
}

// Provisioning API
function provApi(method, path, body) {
  return api(method, PROVISIONING_URL + path, body);
}

// Agent API (calls deployed app)
function agentApi(appUrl, method, path, body) {
  return api(method, appUrl + path, body);
}

// ── Status helpers ──

var STATUS_LABELS = {
  requested: 'Requested',
  provisioning_workspace: 'Provisioning',
  bootstrapping_resources: 'Bootstrapping',
  deploying_app: 'Deploying',
  configuring: 'Configuring',
  verifying_health: 'Verifying',
  healthy: 'Healthy',
  degraded: 'Degraded',
  failed: 'Failed',
  updating: 'Updating',
  deleting: 'Deleting',
  deleted: 'Deleted'
};

function statusBadgeClass(status) {
  if (status === 'healthy') return 'badge-healthy';
  if (status === 'degraded') return 'badge-degraded';
  if (status === 'failed') return 'badge-failed';
  if (status === 'deleting' || status === 'deleted') return 'badge-deleting';
  return 'badge-deploying';
}

function statusBadge(status) {
  return '<span class="badge ' + statusBadgeClass(status) + '">' +
    (STATUS_LABELS[status] || status) + '</span>';
}

function isTransitioning(status) {
  return [
    'requested', 'provisioning_workspace', 'bootstrapping_resources',
    'deploying_app', 'configuring', 'verifying_health', 'updating', 'deleting'
  ].indexOf(status) !== -1;
}

// ── Time helpers ──

function timeAgo(iso) {
  if (!iso) return '—';
  var d = new Date(iso);
  var s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

function formatDuration(ms) {
  if (!ms) return '';
  if (ms < 1000) return ms + 'ms';
  return (ms / 1000).toFixed(1) + 's';
}

// ── URL helpers ──

function getParam(name) {
  var params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// ── DOM helpers ──

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function el(tag, attrs, children) {
  var e = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(function(k) {
    if (k === 'className') e.className = attrs[k];
    else if (k === 'innerHTML') e.innerHTML = attrs[k];
    else if (k === 'onclick') e.onclick = attrs[k];
    else if (k === 'style') e.style.cssText = attrs[k];
    else e.setAttribute(k, attrs[k]);
  });
  if (children) children.forEach(function(c) {
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else if (c) e.appendChild(c);
  });
  return e;
}

// ── Polling ──

var _pollTimer = null;

function startPolling(fn, interval) {
  stopPolling();
  fn();
  _pollTimer = setInterval(fn, interval || 3000);
}

function stopPolling() {
  if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
}

// ── Tabs ──

function initTabs() {
  $$('.tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      var target = this.getAttribute('data-tab');
      $$('.tab').forEach(function(t) { t.classList.remove('active'); });
      $$('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
      this.classList.add('active');
      var panel = document.getElementById('tab-' + target);
      if (panel) panel.classList.add('active');
      if (window.onTabChange) window.onTabChange(target);
    });
  });
}

// ── Modal ──

function openModal(id) {
  var m = document.getElementById(id);
  if (m) m.classList.add('open');
}

function closeModal(id) {
  var m = document.getElementById(id);
  if (m) m.classList.remove('open');
}

// ── Deploy step rendering ──

var DEPLOY_STEPS = [
  { key: 'create_workspace', label: 'Create workspace' },
  { key: 'bootstrap_catalog', label: 'Bootstrap catalog & schema' },
  { key: 'create_warehouse', label: 'Create SQL warehouse' },
  { key: 'create_volume', label: 'Create artifacts volume' },
  { key: 'create_tables', label: 'Create state tables' },
  { key: 'create_secret_scope', label: 'Create secret scope' },
  { key: 'create_lakebase', label: 'Create Lakebase knowledge graph' },
  { key: 'migrate_knowledge_graph', label: 'Migrate knowledge graph schema' },
  { key: 'deploy_app', label: 'Deploy Databricks App' },
  { key: 'grant_permissions', label: 'Grant permissions' },
  { key: 'health_check', label: 'Health check' }
];

function renderDeploySteps(logs) {
  var logMap = {};
  (logs || []).forEach(function(l) {
    logMap[l.step] = l;
  });

  return DEPLOY_STEPS.map(function(step) {
    var log = logMap[step.key];
    var state = 'pending';
    var icon = '&bull;';
    var dur = '';
    if (log) {
      if (log.status === 'completed') { state = 'completed'; icon = '&#10003;'; }
      else if (log.status === 'started') { state = 'running'; icon = '&#8635;'; }
      else if (log.status === 'failed') { state = 'failed'; icon = '&#10007;'; }
      else if (log.status === 'skipped') { state = 'completed'; icon = '&#8211;'; }
      if (log.duration_ms) dur = formatDuration(log.duration_ms);
    }
    return '<div class="deploy-step ' + state + '">' +
      '<div class="deploy-step-icon' + (state === 'running' ? ' spinning' : '') + '">' + icon + '</div>' +
      '<div class="deploy-step-name">' + step.label +
        (log && log.error ? '<div class="text-red" style="font-size:12px;margin-top:2px;">' + log.error + '</div>' : '') +
      '</div>' +
      (dur ? '<div class="deploy-step-duration">' + dur + '</div>' : '') +
      '</div>';
  }).join('');
}
