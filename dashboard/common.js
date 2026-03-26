(function bootstrapCommon(globalScope) {
  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || `Request failed with status ${response.status}`);
    }

    return payload;
  }

  function renderSummaryCards(container, summary) {
    container.innerHTML = '';
    Object.entries(summary).forEach(([label, value]) => {
      const card = document.createElement('article');
      card.className = 'summary-card';
      card.innerHTML = `
        <p class="summary-label">${label.replace(/_/g, ' ')}</p>
        <p class="summary-value">${value}</p>
      `;
      container.appendChild(card);
    });
  }

  function statusChip(status) {
    const value = String(status || '').toUpperCase();
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = value || 'UNKNOWN';

    if (value === 'CRITICAL') {
      chip.classList.add('critical');
    } else if (value === 'HIGH') {
      chip.classList.add('high');
    } else if (value === 'MEDIUM') {
      chip.classList.add('medium');
    } else if (value === 'LOW') {
      chip.classList.add('low');
    } else if (value.includes('FAIL') || value.includes('BLOCKED')) {
      chip.classList.add('fail');
    } else if (value.includes('PASS')) {
      chip.classList.add('pass');
    } else {
      chip.classList.add('warn');
    }

    return chip;
  }

  function buildDetailRows(container, row, orderedFields) {
    container.innerHTML = '';

    orderedFields.forEach((field) => {
      const wrapper = document.createElement('section');
      wrapper.className = 'detail-row';

      const label = document.createElement('p');
      label.className = 'detail-label';
      label.textContent = field.label;

      const value = document.createElement('p');
      value.className = `detail-value ${field.mono ? 'mono' : ''}`;
      value.textContent = row?.[field.key] || '—';

      wrapper.append(label, value);
      container.appendChild(wrapper);
    });
  }

  function showToast(message, isError) {
    const element = document.getElementById('toast');
    if (!element) {
      return;
    }

    element.textContent = message;
    element.style.background = isError ? 'rgba(180, 35, 24, 0.94)' : 'rgba(31, 42, 55, 0.92)';
    element.classList.add('is-visible');

    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      element.classList.remove('is-visible');
    }, 2600);
  }

  function overallStatus(lastExecution) {
    const text = String(lastExecution || '');

    if (/\bFAIL\b/.test(text)) {
      return 'FAIL';
    }

    if (/\bPASS\b/.test(text)) {
      return 'PASS';
    }

    if (/\bBLOCKED\b/.test(text)) {
      return 'BLOCKED';
    }

    if (/\bPARTIAL\b/.test(text)) {
      return 'PARTIAL';
    }

    if (/\bNOT_RUN\b/.test(text)) {
      return 'NOT_RUN';
    }

    return text.trim() ? 'UPDATED' : 'BLANK';
  }

  globalScope.PaylocityDashboard = {
    buildDetailRows,
    escapeRegExp,
    fetchJson,
    overallStatus,
    renderSummaryCards,
    showToast,
    statusChip,
  };
})(window);
