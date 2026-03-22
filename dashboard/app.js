const STORAGE_KEY = 'taf-dashboard-settings';
const TRIAGE_KEY = 'taf-dashboard-triage';

const defaults = {
  token: '',
  owner: 'stompercito',
  repo: 'test-automation-framework',
  workflow: 'qa-runner.yml',
  branch: 'main',
  suite: 'all',
  shoptest_version: '3',
  base_url: 'https://stompercito.github.io/web-application-for-automation/',
};

const triageOptions = [
  { value: 'untriaged', label: 'Untriaged' },
  { value: 'bug', label: 'Bug' },
  { value: 'system_failure', label: 'System failure' },
  { value: 'test_script_issue', label: 'Test script issue' },
  { value: 'env_issue', label: 'Environment issue' },
  { value: 'not_an_issue', label: 'Not an issue' },
];

const settings = loadSettings();
let runs = [];
let selectedRunId = null;
let currentJobs = [];
let currentArtifacts = [];
let autoTimer = null;

const launchBtn = document.getElementById('launchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const autoRefresh = document.getElementById('autoRefresh');
const statusMessage = document.getElementById('statusMessage');

renderSettings();
renderMetrics();
wireButtons();
refreshEverything();

function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...defaults, ...parsed };
  } catch {
    return { ...defaults };
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function loadTriage() {
  try {
    return JSON.parse(localStorage.getItem(TRIAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveTriage(next) {
  localStorage.setItem(TRIAGE_KEY, JSON.stringify(next));
}

function headers() {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${settings.token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function canRun() {
  return Boolean(settings.token && settings.owner && settings.repo && settings.workflow);
}

function notify(text) {
  statusMessage.textContent = text || '';
}

function field(labelText, key, type = 'text', options = []) {
  const wrap = document.createElement('label');
  wrap.textContent = labelText;

  let control;

  if (type === 'select') {
    control = document.createElement('select');
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      control.appendChild(option);
    });
  } else {
    control = document.createElement('input');
    control.type = type;
  }

  control.value = settings[key] || '';
  control.addEventListener('input', event => {
    settings[key] = event.target.value;
    saveSettings();
  });

  wrap.appendChild(control);
  return wrap;
}

function renderSettings() {
  const grid = document.getElementById('settingsGrid');
  grid.innerHTML = '';

  grid.appendChild(field('GitHub Token (PAT)', 'token', 'password'));
  grid.appendChild(field('Owner', 'owner'));
  grid.appendChild(field('Repository', 'repo'));
  grid.appendChild(field('Workflow file', 'workflow'));
  grid.appendChild(field('Branch', 'branch'));
  grid.appendChild(field('Suite', 'suite', 'select', [
    { value: 'all', label: 'All' },
    { value: 'functional', label: 'Functional' },
    { value: 'non-functional', label: 'Non-Functional' },
  ]));
  grid.appendChild(field('ShopTest version', 'shoptest_version', 'select', [
    { value: '1', label: 'V1' },
    { value: '2', label: 'V2' },
    { value: '3', label: 'V3' },
  ]));
  grid.appendChild(field('Base URL (optional)', 'base_url'));
}

function tone(item) {
  if (item.status !== 'completed') return 'running';
  if (item.conclusion === 'success') return 'success';
  if (item.conclusion === 'failure') return 'failure';
  return 'neutral';
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '-';
}

function wireButtons() {
  launchBtn.addEventListener('click', launchRun);
  refreshBtn.addEventListener('click', refreshEverything);
  autoRefresh.addEventListener('change', () => {
    if (autoRefresh.checked) {
      startAutoRefresh();
    } else if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  });
}

async function launchRun() {
  if (!canRun()) {
    notify('Token, owner, repo, and workflow are required.');
    return;
  }

  launchBtn.disabled = true;
  notify('Dispatching workflow run...');

  try {
    const url = `https://api.github.com/repos/${settings.owner}/${settings.repo}/actions/workflows/${settings.workflow}/dispatches`;
    const response = await fetch(url, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        ref: settings.branch,
        inputs: {
          suite: settings.suite,
          shoptest_version: settings.shoptest_version,
          base_url: settings.base_url,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Dispatch failed (${response.status}).`);
    }

    notify('Run launched. Refreshing list...');
    setTimeout(refreshEverything, 3000);
  } catch (error) {
    notify(error.message);
  } finally {
    launchBtn.disabled = false;
  }
}

async function fetchRuns() {
  if (!canRun()) {
    runs = [];
    renderRuns();
    renderMetrics();
    return;
  }

  const url = `https://api.github.com/repos/${settings.owner}/${settings.repo}/actions/workflows/${settings.workflow}/runs?per_page=15`;
  const response = await fetch(url, { headers: headers() });

  if (!response.ok) {
    throw new Error(`Could not load runs (${response.status}).`);
  }

  const payload = await response.json();
  runs = payload.workflow_runs || [];

  if (!selectedRunId && runs.length > 0) {
    selectedRunId = runs[0].id;
  }
}

async function fetchRunDetails(runId) {
  if (!runId || !canRun()) {
    currentJobs = [];
    currentArtifacts = [];
    return;
  }

  const jobsUrl = `https://api.github.com/repos/${settings.owner}/${settings.repo}/actions/runs/${runId}/jobs`;
  const artifactsUrl = `https://api.github.com/repos/${settings.owner}/${settings.repo}/actions/runs/${runId}/artifacts`;

  const [jobsRes, artifactsRes] = await Promise.all([
    fetch(jobsUrl, { headers: headers() }),
    fetch(artifactsUrl, { headers: headers() }),
  ]);

  if (!jobsRes.ok || !artifactsRes.ok) {
    throw new Error('Could not load selected run details.');
  }

  const jobsPayload = await jobsRes.json();
  const artifactsPayload = await artifactsRes.json();
  currentJobs = jobsPayload.jobs || [];
  currentArtifacts = artifactsPayload.artifacts || [];
}

async function downloadArtifact(artifact) {
  notify(`Downloading ${artifact.name}...`);

  try {
    const response = await fetch(artifact.archive_download_url, { headers: headers() });

    if (!response.ok) {
      throw new Error(`Download failed (${response.status}).`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${artifact.name}.zip`;
    link.click();
    URL.revokeObjectURL(url);
    notify(`${artifact.name} downloaded.`);
  } catch (error) {
    notify(error.message);
  }
}

function renderMetrics() {
  const container = document.getElementById('metrics');
  const completed = runs.filter(run => run.status === 'completed');

  const data = [
    { label: 'Total runs', value: runs.length },
    { label: 'In progress', value: runs.filter(run => run.status !== 'completed').length },
    { label: 'Passed', value: completed.filter(run => run.conclusion === 'success').length },
    { label: 'Failed', value: completed.filter(run => run.conclusion === 'failure').length },
  ];

  container.innerHTML = '';

  data.forEach(metric => {
    const card = document.createElement('article');
    card.className = 'metric';
    card.innerHTML = `<span>${metric.label}</span><strong>${metric.value}</strong>`;
    container.appendChild(card);
  });
}

function renderRuns() {
  const list = document.getElementById('runList');
  list.innerHTML = '';

  if (!runs.length) {
    list.innerHTML = '<p class="empty">No runs yet.</p>';
    return;
  }

  runs.forEach(run => {
    const button = document.createElement('button');
    button.className = `run-item ${selectedRunId === run.id ? 'selected' : ''}`;
    button.innerHTML = `
      <strong>${run.display_title || run.name}</strong>
      <div class="meta-row">
        <span class="pill ${tone(run)}">${run.status === 'completed' ? run.conclusion : run.status}</span>
        <span>#${run.run_number}</span>
        <span>${formatDate(run.created_at)}</span>
      </div>
    `;

    button.addEventListener('click', async () => {
      selectedRunId = run.id;
      renderRuns();
      await refreshDetails();
    });

    list.appendChild(button);
  });
}

function triageKey(runId, jobId) {
  return `${runId}:${jobId}`;
}

function renderDetails() {
  const container = document.getElementById('runDetails');
  const selected = runs.find(run => run.id === selectedRunId);

  if (!selected) {
    container.innerHTML = '<p class="empty">Select a run.</p>';
    return;
  }

  const triageData = loadTriage();

  const section = document.createElement('section');
  section.innerHTML = `
    <p><strong>${selected.display_title || selected.name}</strong></p>
    <p><a href="${selected.html_url}" target="_blank" rel="noreferrer">Open run in GitHub</a></p>
    <p class="empty">Started: ${formatDate(selected.run_started_at || selected.created_at)}</p>
    <h3>Jobs</h3>
  `;

  currentJobs.forEach(job => {
    const key = triageKey(selected.id, job.id);
    const triage = triageData[key] || { category: 'untriaged', notes: '' };

    const jobDiv = document.createElement('div');
    jobDiv.className = 'job';
    jobDiv.innerHTML = `
      <div class="job-head">
        <strong>${job.name}</strong>
        <span class="pill ${tone(job)}">${job.status === 'completed' ? job.conclusion : job.status}</span>
      </div>
      <p class="empty">${formatDate(job.started_at)}</p>
      <p><a href="${job.html_url}" target="_blank" rel="noreferrer">View logs</a></p>
      <div class="triage">
        <label>Triage</label>
        <label>Notes</label>
      </div>
    `;

    const triageRow = jobDiv.querySelector('.triage');
    const categorySelect = document.createElement('select');
    triageOptions.forEach(option => {
      const entry = document.createElement('option');
      entry.value = option.value;
      entry.textContent = option.label;
      categorySelect.appendChild(entry);
    });
    categorySelect.value = triage.category;

    const notesInput = document.createElement('textarea');
    notesInput.rows = 2;
    notesInput.value = triage.notes || '';
    notesInput.placeholder = 'Quick triage note';

    categorySelect.addEventListener('change', () => {
      const next = loadTriage();
      next[key] = { ...(next[key] || {}), category: categorySelect.value, notes: notesInput.value };
      saveTriage(next);
    });

    notesInput.addEventListener('input', () => {
      const next = loadTriage();
      next[key] = { ...(next[key] || {}), category: categorySelect.value, notes: notesInput.value };
      saveTriage(next);
    });

    triageRow.appendChild(categorySelect);
    triageRow.appendChild(notesInput);
    section.appendChild(jobDiv);
  });

  const artifactHeader = document.createElement('h3');
  artifactHeader.textContent = 'Artifacts';
  section.appendChild(artifactHeader);

  if (!currentArtifacts.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No artifacts for this run yet.';
    section.appendChild(empty);
  }

  currentArtifacts.forEach(artifact => {
    const row = document.createElement('div');
    row.className = 'artifact';

    const head = document.createElement('div');
    head.className = 'artifact-head';

    const left = document.createElement('div');
    left.innerHTML = `<strong>${artifact.name}</strong><p class="empty">Expires: ${formatDate(artifact.expires_at)}</p>`;

    const right = document.createElement('div');
    const pill = document.createElement('span');
    pill.className = `pill ${artifact.expired ? 'failure' : 'neutral'}`;
    pill.textContent = artifact.expired ? 'expired' : 'available';

    const download = document.createElement('button');
    download.className = 'secondary';
    download.textContent = 'Download';
    download.disabled = artifact.expired;
    download.addEventListener('click', () => downloadArtifact(artifact));

    right.appendChild(pill);
    right.appendChild(document.createTextNode(' '));
    right.appendChild(download);
    head.appendChild(left);
    head.appendChild(right);
    row.appendChild(head);
    section.appendChild(row);
  });

  container.innerHTML = '';
  container.appendChild(section);
}

async function refreshDetails() {
  try {
    await fetchRunDetails(selectedRunId);
    renderDetails();
  } catch (error) {
    notify(error.message);
  }
}

async function refreshEverything() {
  try {
    await fetchRuns();
    renderRuns();
    renderMetrics();
    await refreshDetails();
    notify('Dashboard refreshed.');
  } catch (error) {
    notify(error.message);
  }

  startAutoRefresh();
}

function startAutoRefresh() {
  if (autoTimer) {
    clearInterval(autoTimer);
  }

  if (!autoRefresh.checked) {
    autoTimer = null;
    return;
  }

  autoTimer = setInterval(() => {
    refreshEverything();
  }, 10000);
}
