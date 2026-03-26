const { buildDetailRows, fetchJson, renderSummaryCards, showToast, statusChip } = window.PaylocityDashboard;

const state = {
  rows: [],
  filteredRows: [],
  selectedId: null,
};

function applyFilters() {
  const searchText = document.getElementById('searchInput').value.trim().toLowerCase();
  const severity = document.getElementById('severityFilter').value;

  state.filteredRows = state.rows.filter((row) => {
    const haystack = [
      row.bug_id,
      row.title,
      row.area,
      row.module_or_endpoint,
      row.source_test_case_ids,
      row.notes,
    ]
      .join(' ')
      .toLowerCase();

    if (searchText && !haystack.includes(searchText)) {
      return false;
    }

    if (severity && row.severity !== severity) {
      return false;
    }

    return true;
  });
}

function renderTable() {
  applyFilters();

  const tbody = document.getElementById('resultsBody');
  tbody.innerHTML = '';

  if (state.filteredRows.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="6"><div class="empty-state">No bug reports match the current filters.</div></td>';
    tbody.appendChild(emptyRow);
    return;
  }

  state.filteredRows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.className = row.bug_id === state.selectedId ? 'is-selected' : '';
    tr.addEventListener('click', () => {
      state.selectedId = row.bug_id;
      renderTable();
      renderSelectedRow();
    });

    const severityCell = document.createElement('td');
    severityCell.appendChild(statusChip(row.severity));

    tr.innerHTML = `
      <td class="mono">${row.bug_id}</td>
      <td><div class="truncate">${row.title}</div></td>
      <td>${row.area}</td>
      <td>${row.module_or_endpoint}</td>
      <td>${row.priority}</td>
    `;

    tr.appendChild(severityCell);
    tbody.appendChild(tr);
  });
}

function renderSelectedRow() {
  const selected =
    state.rows.find((row) => row.bug_id === state.selectedId) ||
    state.filteredRows[0] ||
    state.rows[0];

  if (!selected) {
    return;
  }

  state.selectedId = selected.bug_id;
  document.getElementById('detailTitle').textContent = `${selected.bug_id} · ${selected.title}`;

  const meta = document.getElementById('detailMeta');
  meta.innerHTML = '';
  meta.append(statusChip(selected.severity), createChip(selected.priority), createChip(selected.area));

  buildDetailRows(document.getElementById('detailGrid'), selected, [
    { key: 'module_or_endpoint', label: 'Module / Endpoint' },
    { key: 'source_test_case_ids', label: 'Source Test Cases' },
    { key: 'preconditions', label: 'Preconditions' },
    { key: 'steps_to_reproduce', label: 'Steps To Reproduce' },
    { key: 'actual_result', label: 'Actual Result' },
    { key: 'expected_result', label: 'Expected Result' },
    { key: 'evidence', label: 'Evidence' },
    { key: 'notes', label: 'Notes' },
  ]);
}

function createChip(value) {
  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.textContent = value;
  return chip;
}

async function initialize() {
  const payload = await fetchJson('/api/bug-reports');
  state.rows = payload.rows;
  state.filteredRows = payload.rows;
  state.selectedId = payload.rows[0]?.bug_id || null;

  renderSummaryCards(document.getElementById('summaryGrid'), payload.summary);
  renderTable();
  renderSelectedRow();

  document.getElementById('searchInput').addEventListener('input', () => {
    renderTable();
    renderSelectedRow();
  });
  document.getElementById('severityFilter').addEventListener('change', () => {
    renderTable();
    renderSelectedRow();
  });
}

initialize().catch((error) => {
  showToast(error.message || 'Failed to load bug reports.', true);
});
