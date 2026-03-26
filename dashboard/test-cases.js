const {
  buildDetailRows,
  fetchJson,
  overallStatus,
  renderSummaryCards,
  showToast,
  statusChip,
} = window.PaylocityDashboard;

const MANUAL_OPTIONS = ['PASS', 'FAIL', 'PARTIAL', 'BLOCKED', 'NOT_RUN'];
const EDITABLE_CLASSIFICATIONS = new Set(['Hybrid', 'Manual']);

const state = {
  rows: [],
  filteredRows: [],
  selectedId: null,
};

function isEditable(row) {
  return EDITABLE_CLASSIFICATIONS.has(row.classification);
}

function deriveCurrentManualStatus(lastExecution) {
  const current = overallStatus(lastExecution);
  return MANUAL_OPTIONS.includes(current) ? current : '';
}

function applyFilters() {
  const searchText = document.getElementById('searchInput').value.trim().toLowerCase();
  const classification = document.getElementById('classificationFilter').value;
  const status = document.getElementById('statusFilter').value;

  state.filteredRows = state.rows.filter((row) => {
    const haystack = [
      row.test_case_id,
      row.title,
      row.category,
      row.area,
      row.classification,
      row.priority,
      row.notes,
      row.last_execution,
    ]
      .join(' ')
      .toLowerCase();

    if (searchText && !haystack.includes(searchText)) {
      return false;
    }

    if (classification && row.classification !== classification) {
      return false;
    }

    if (status && overallStatus(row.last_execution) !== status) {
      return false;
    }

    return true;
  });
}

function renderLiveSummary() {
  renderSummaryCards(document.getElementById('summaryGrid'), {
    total: state.rows.length,
    automatable: state.rows.filter((row) => row.classification === 'Automatable').length,
    hybrid: state.rows.filter((row) => row.classification === 'Hybrid').length,
    manual: state.rows.filter((row) => row.classification === 'Manual').length,
    pass: state.rows.filter((row) => /\bPASS\b/.test(row.last_execution)).length,
    fail: state.rows.filter((row) => /\bFAIL\b/.test(row.last_execution)).length,
    blank: state.rows.filter((row) => !String(row.last_execution || '').trim()).length,
  });
}

function buildManualSelect(row) {
  if (!isEditable(row)) {
    const locked = document.createElement('span');
    locked.className = 'mono';
    locked.textContent = '—';
    return locked;
  }

  const select = document.createElement('select');
  select.className = 'status-select';
  select.disabled = false;

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Set result';
  select.appendChild(placeholder);

  MANUAL_OPTIONS.forEach((optionValue) => {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    select.appendChild(option);
  });

  select.value = deriveCurrentManualStatus(row.last_execution);
  select.addEventListener('click', (event) => event.stopPropagation());
  select.addEventListener('change', async (event) => {
    const nextStatus = event.target.value;
    if (!nextStatus) {
      return;
    }

    try {
      select.disabled = true;
      const result = await fetchJson(`/api/test-cases/${encodeURIComponent(row.test_case_id)}/manual-result`, {
        method: 'POST',
        body: JSON.stringify({ status: nextStatus }),
      });
      row.last_execution = result.lastExecution;
      renderLiveSummary();
      renderTable();
      renderSelectedRow();
      showToast(`Updated ${row.test_case_id} to ${nextStatus}.`);
    } catch (error) {
      select.value = deriveCurrentManualStatus(row.last_execution);
      showToast(error.message || 'Unable to update result.', true);
    } finally {
      select.disabled = false;
    }
  });

  return select;
}

function renderTable() {
  applyFilters();

  const tbody = document.getElementById('resultsBody');
  tbody.innerHTML = '';

  if (state.filteredRows.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="7"><div class="empty-state">No test cases match the current filters.</div></td>';
    tbody.appendChild(emptyRow);
    return;
  }

  state.filteredRows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.className = row.test_case_id === state.selectedId ? 'is-selected' : '';
    tr.addEventListener('click', () => {
      state.selectedId = row.test_case_id;
      renderTable();
      renderSelectedRow();
    });

    const statusCell = document.createElement('td');
    statusCell.appendChild(statusChip(overallStatus(row.last_execution)));

    const manualCell = document.createElement('td');
    manualCell.appendChild(buildManualSelect(row));

    tr.innerHTML = `
      <td class="mono">${row.test_case_id}</td>
      <td><div class="truncate">${row.title}</div></td>
      <td>${row.classification}</td>
      <td>${row.priority}</td>
      <td>${row.category}</td>
    `;

    tr.appendChild(statusCell);
    tr.appendChild(manualCell);
    tbody.appendChild(tr);
  });
}

function renderSelectedRow() {
  const selected =
    state.filteredRows.find((row) => row.test_case_id === state.selectedId) ||
    state.filteredRows[0] ||
    state.rows[0];

  if (!selected) {
    return;
  }

  state.selectedId = selected.test_case_id;

  document.getElementById('detailTitle').textContent = `${selected.test_case_id} · ${selected.title}`;
  const meta = document.getElementById('detailMeta');
  meta.innerHTML = '';
  meta.append(
    statusChip(overallStatus(selected.last_execution)),
    createChip(selected.classification),
    createChip(selected.area),
    createChip(selected.priority),
  );

  buildDetailRows(document.getElementById('detailGrid'), selected, [
    { key: 'category', label: 'Category' },
    { key: 'technique', label: 'Technique' },
    { key: 'data_matrix_id', label: 'Data Matrix' },
    { key: 'preconditions', label: 'Preconditions' },
    { key: 'test_data', label: 'Test Data' },
    { key: 'gherkin_steps', label: 'Gherkin Steps' },
    { key: 'expected_result', label: 'Expected Result' },
    { key: 'notes', label: 'Notes' },
    { key: 'last_execution', label: 'Last Execution', mono: true },
  ]);
}

function createChip(value) {
  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.textContent = value;
  return chip;
}

async function initialize() {
  const payload = await fetchJson('/api/test-cases');
  state.rows = payload.rows;
  state.filteredRows = payload.rows;
  renderLiveSummary();
  state.selectedId = payload.rows[0]?.test_case_id || null;
  renderTable();
  renderSelectedRow();

  document.getElementById('searchInput').addEventListener('input', () => {
    renderTable();
    renderSelectedRow();
  });
  document.getElementById('classificationFilter').addEventListener('change', () => {
    renderTable();
    renderSelectedRow();
  });
  document.getElementById('statusFilter').addEventListener('change', () => {
    renderTable();
    renderSelectedRow();
  });
}

initialize().catch((error) => {
  showToast(error.message || 'Failed to load test cases.', true);
});
