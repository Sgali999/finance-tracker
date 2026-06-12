// ── APP RENDER LAYER ──
let _charts = {};

function renderAll() {
  updateMonthFilters();
  document.getElementById('header-year').textContent = new Date().getFullYear();
  const activePage = document.querySelector('.page.active')?.id || 'page-dashboard';
  if (activePage === 'page-dashboard') renderDashboard();
  if (activePage === 'page-transactions') renderTransactions();
  if (activePage === 'page-investments') renderInvestments();
  if (activePage === 'page-reports') renderReports();
}

function updateMonthFilters() {
  const months = getMonths();
  const dashSel = document.getElementById('dash-month-filter');
  const current = dashSel.value;
  dashSel.innerHTML = '<option value="all">All Time</option>' +
    months.map(m => `<option value="${m}">${m}</option>`).join('');
  if (current && months.includes(current)) dashSel.value = current;

  const txnTypeSel = document.getElementById('txn-filter-type');
  const types = [...new Set(state.transactions.map(t => t.type))];
  txnTypeSel.innerHTML = '<option value="all">All Types</option>' +
    types.map(t => `<option>${t}</option>`).join('');

  const reportSel = document.getElementById('report-month-select');
  reportSel.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
}

// ── DASHBOARD ──
function renderDashboard() {
  const filter = document.getElementById('dash-month-filter').value;
  const isAll = filter === 'all';

  let txns = isAll ? state.transactions : state.transactions.filter(t => t.month === filter);
  const inAmt  = txns.filter(t => t.flow === 'in').reduce((s, t) => s + t.amount, 0);
  const outAmt = txns.filter(t => t.flow === 'out').reduce((s, t) => s + t.amount, 0);
  const invested = totalActive();

  document.getElementById('kpi-in').textContent = fmt(inAmt);
  document.getElementById('kpi-out').textContent = fmt(outAmt);
  document.getElementById('kpi-net').textContent = fmt(inAmt - outAmt);
  document.getElementById('kpi-invested').textContent = fmt(invested);

  // Subtext
  const salary = txns.filter(t => t.type === 'Salary').reduce((s,t) => s+t.amount, 0);
  document.getElementById('kpi-in-sub').textContent = salary ? `Salary: ${fmt(salary)}` : '';
  const expense = txns.filter(t => ['Monthly Expense','Other Expense'].includes(t.type)).reduce((s,t) => s+t.amount, 0);
  document.getElementById('kpi-out-sub').textContent = expense ? `Expenses: ${fmt(expense)}` : '';

  renderCashflowChart();
  renderInvestmentDonut();
  renderInvestSummaryTable();
  renderRecentTxns();
}

function renderCashflowChart() {
  const months = getMonths().reverse().slice(-12);
  const inData = months.map(m => state.transactions.filter(t => t.flow === 'in' && t.month === m).reduce((s,t) => s+t.amount, 0));
  const outData = months.map(m => state.transactions.filter(t => t.flow === 'out' && t.month === m).reduce((s,t) => s+t.amount, 0));

  destroyChart('chart-cashflow');
  const ctx = document.getElementById('chart-cashflow').getContext('2d');
  _charts['chart-cashflow'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.map(m => { const d = new Date(m+'-01'); return d.toLocaleString('en-IN',{month:'short',year:'2-digit'}); }),
      datasets: [
        { label: 'IN', data: inData, backgroundColor: 'rgba(34,197,94,0.7)', borderRadius: 4 },
        { label: 'OUT', data: outData, backgroundColor: 'rgba(239,68,68,0.6)', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { labels: { color: '#7b869e', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#7b869e', font: { size: 10 } }, grid: { color: '#2a3349' } },
        y: { ticks: { color: '#7b869e', font: { size: 10 }, callback: v => '₹'+v.toLocaleString('en-IN') }, grid: { color: '#2a3349' } }
      }
    }
  });
}

function renderInvestmentDonut() {
  const types = [...new Set(state.investments.filter(i => i.status === 'Active').map(i => i.type))];
  const data = types.map(t => state.investments.filter(i => i.type === t && i.status === 'Active').reduce((s,i) => s+i.amount, 0));
  const colors = ['#3b82f6','#22c55e','#f59e0b','#a855f7','#ef4444','#06b6d4','#f97316','#84cc16'];

  destroyChart('chart-invest');
  const ctx = document.getElementById('chart-invest').getContext('2d');
  _charts['chart-invest'] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: types,
      datasets: [{ data, backgroundColor: colors.slice(0, types.length), borderWidth: 2, borderColor: '#161b27' }]
    },
    options: {
      responsive: true, maintainAspectRatio: true, cutout: '65%',
      plugins: { legend: { position: 'bottom', labels: { color: '#7b869e', font: { size: 11 }, padding: 10, boxWidth: 12 } } }
    }
  });
}

function renderInvestSummaryTable() {
  const types = [...new Set(state.investments.map(i => i.type))];
  const tbody = document.querySelector('#invest-summary-table tbody');
  tbody.innerHTML = types.map(t => {
    const active = state.investments.filter(i => i.type === t && i.status === 'Active');
    const closed = state.investments.filter(i => i.type === t && i.status === 'Closed');
    const amt = active.reduce((s,i) => s+i.amount, 0);
    return `<tr>
      <td>${t}</td>
      <td class="amount-out">${fmt(amt)}</td>
      <td>${active.length}</td>
      <td>
        <span class="badge badge-active">${active.length} active</span>
        ${closed.length ? `<span class="badge badge-closed">${closed.length} closed</span>` : ''}
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="4" style="color:var(--text-muted);text-align:center">No investments yet</td></tr>';
}

function renderRecentTxns() {
  const recent = [...state.transactions].sort((a,b) => b.date.localeCompare(a.date)).slice(0,8);
  const tbody = document.querySelector('#recent-txn-table tbody');
  tbody.innerHTML = recent.map(t => `<tr>
    <td>${fmtDate(t.date)}</td>
    <td>${t.type}</td>
    <td class="${t.flow === 'in' ? 'amount-in' : 'amount-out'}">${t.flow === 'in' ? '+' : '-'}${fmt(t.amount)}</td>
    <td><span class="badge badge-${t.flow}">${t.flow.toUpperCase()}</span></td>
  </tr>`).join('') || '<tr><td colspan="4" style="color:var(--text-muted);text-align:center">No transactions yet</td></tr>';
}

// ── TRANSACTIONS PAGE ──
function renderTransactions() {
  const flowFilter = document.getElementById('txn-filter-flow').value;
  const typeFilter = document.getElementById('txn-filter-type').value;
  const monthFilter = document.getElementById('txn-filter-month').value;

  let txns = [...state.transactions].sort((a,b) => b.date.localeCompare(a.date));
  if (flowFilter !== 'all') txns = txns.filter(t => t.flow === flowFilter);
  if (typeFilter !== 'all') txns = txns.filter(t => t.type === typeFilter);
  if (monthFilter) txns = txns.filter(t => t.month === monthFilter);

  const tbody = document.querySelector('#txn-full-table tbody');
  tbody.innerHTML = txns.map(t => `<tr>
    <td>${fmtDate(t.date)}</td>
    <td>${t.month}</td>
    <td>${t.type}</td>
    <td><span class="badge badge-${t.flow}">${t.flow.toUpperCase()}</span></td>
    <td class="${t.flow === 'in' ? 'amount-in' : 'amount-out'}">${t.flow === 'in' ? '+' : ''}${fmt(t.amount)}</td>
    <td>${t.reference || '—'}</td>
    <td>${t.notes || '—'}</td>
  </tr>`).join('') || '<tr><td colspan="7" style="color:var(--text-muted);text-align:center;padding:24px">No transactions found</td></tr>';
}

// ── INVESTMENTS PAGE ──
function renderInvestments() {
  const typeFilter = document.getElementById('inv-filter-type').value;
  const statusFilter = document.getElementById('inv-filter-status').value;

  let invs = [...state.investments].sort((a,b) => b.date.localeCompare(a.date));
  if (typeFilter !== 'all') invs = invs.filter(i => i.type === typeFilter);
  if (statusFilter !== 'all') invs = invs.filter(i => i.status === statusFilter);

  const tbody = document.querySelector('#inv-full-table tbody');
  tbody.innerHTML = invs.map(i => `<tr>
    <td>${fmtDate(i.date)}</td>
    <td>${i.type}</td>
    <td>${i.reference || '—'}</td>
    <td class="amount-out">${fmt(i.amount)}</td>
    <td class="${i.returnAmount ? 'amount-in' : ''}">${i.returnAmount ? fmt(i.returnAmount) : '—'}</td>
    <td><span class="badge badge-${i.status.toLowerCase()}">${i.status}</span></td>
    <td>${i.reinvestedInto ? `<strong>${i.reinvestedInto}</strong>${i.reinvestNote ? ' – '+i.reinvestNote : ''}` : '—'}</td>
    <td>${i.status === 'Active'
      ? `<button class="btn-remove" style="font-size:0.75rem;padding:5px 10px" onclick="openBreakModal('${i.id}')">Close</button>`
      : `<span style="color:var(--text-dim);font-size:0.75rem">${fmtDate(i.returnDate) || '—'}</span>`
    }</td>
  </tr>`).join('') || '<tr><td colspan="8" style="color:var(--text-muted);text-align:center;padding:24px">No investments found</td></tr>';
}

// ── REPORTS PAGE ──
function renderReports() {
  renderYearlyChart();
  renderExpenseChart();
  renderSavingsChart();
  renderMonthReport();
}

function renderYearlyChart() {
  const years = [...new Set(state.transactions.map(t => t.date.slice(0,4)).filter(Boolean))].sort();
  const inD  = years.map(y => state.transactions.filter(t => t.flow === 'in' && t.date.startsWith(y)).reduce((s,t)=>s+t.amount,0));
  const outD = years.map(y => state.transactions.filter(t => t.flow === 'out' && t.date.startsWith(y)).reduce((s,t)=>s+t.amount,0));

  destroyChart('chart-yearly');
  const ctx = document.getElementById('chart-yearly').getContext('2d');
  _charts['chart-yearly'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: years,
      datasets: [
        { label: 'Total IN', data: inD, backgroundColor: 'rgba(34,197,94,0.7)', borderRadius: 4 },
        { label: 'Total OUT', data: outD, backgroundColor: 'rgba(239,68,68,0.6)', borderRadius: 4 },
        { label: 'Net', data: years.map((_,i) => inD[i] - outD[i]), type: 'line',
          borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)',
          pointBackgroundColor: '#6366f1', fill: true, tension: 0.3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { labels: { color: '#7b869e', font: {size: 11} } } },
      scales: {
        x: { ticks: { color: '#7b869e' }, grid: { color: '#2a3349' } },
        y: { ticks: { color: '#7b869e', callback: v => '₹'+v.toLocaleString('en-IN') }, grid: { color: '#2a3349' } }
      }
    }
  });
}

function renderExpenseChart() {
  const expTypes = ['Monthly Expense', 'Other Expense'];
  const txns = state.transactions.filter(t => expTypes.includes(t.type));
  // group by reference
  const byRef = {};
  txns.forEach(t => { byRef[t.reference || 'Other'] = (byRef[t.reference || 'Other'] || 0) + t.amount; });
  const labels = Object.keys(byRef).slice(0, 8);
  const data = labels.map(l => byRef[l]);

  destroyChart('chart-expense');
  const ctx = document.getElementById('chart-expense').getContext('2d');
  _charts['chart-expense'] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{ data, backgroundColor: ['#ef4444','#f97316','#f59e0b','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899'], borderWidth: 2, borderColor: '#161b27' }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom', labels: { color: '#7b869e', font: {size: 11}, padding: 8, boxWidth: 12 } } }
    }
  });
}

function renderSavingsChart() {
  const months = getMonths().reverse().slice(-12);
  const salaryD = months.map(m => state.transactions.filter(t => t.type === 'Salary' && t.month === m).reduce((s,t)=>s+t.amount,0));
  const expD    = months.map(m => state.transactions.filter(t => ['Monthly Expense','Other Expense'].includes(t.type) && t.month === m).reduce((s,t)=>s+t.amount,0));
  const investD = months.map(m => state.transactions.filter(t => INVESTMENT_TYPES.includes(t.type) && t.month === m).reduce((s,t)=>s+t.amount,0));

  destroyChart('chart-savings');
  const ctx = document.getElementById('chart-savings').getContext('2d');
  _charts['chart-savings'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.map(m => { const d = new Date(m+'-01'); return d.toLocaleString('en-IN',{month:'short',year:'2-digit'}); }),
      datasets: [
        { label: 'Salary', data: salaryD, backgroundColor: 'rgba(34,197,94,0.7)', borderRadius: 4 },
        { label: 'Expense', data: expD, backgroundColor: 'rgba(239,68,68,0.6)', borderRadius: 4 },
        { label: 'Invested', data: investD, backgroundColor: 'rgba(99,102,241,0.6)', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { labels: { color: '#7b869e', font: {size: 11} } } },
      scales: {
        x: { stacked: false, ticks: { color: '#7b869e', font: {size: 10} }, grid: { color: '#2a3349' } },
        y: { ticks: { color: '#7b869e', callback: v => '₹'+v.toLocaleString('en-IN') }, grid: { color: '#2a3349' } }
      }
    }
  });
}

function renderMonthReport() {
  const month = document.getElementById('report-month-select').value;
  if (!month) return;
  const txns = state.transactions.filter(t => t.month === month);
  const inAmt   = txns.filter(t => t.flow === 'in').reduce((s,t)=>s+t.amount, 0);
  const outAmt  = txns.filter(t => t.flow === 'out').reduce((s,t)=>s+t.amount, 0);
  const salary  = txns.filter(t => t.type === 'Salary').reduce((s,t)=>s+t.amount, 0);
  const expense = txns.filter(t => ['Monthly Expense','Other Expense'].includes(t.type)).reduce((s,t)=>s+t.amount, 0);
  const invested= txns.filter(t => INVESTMENT_TYPES.includes(t.type)).reduce((s,t)=>s+t.amount, 0);
  const savings = inAmt - outAmt;

  document.getElementById('monthly-report-content').innerHTML = `
    <div class="monthly-report-grid">
      <div class="report-kpi"><div class="label">Salary</div><div class="value amount-in">${fmt(salary)}</div></div>
      <div class="report-kpi"><div class="label">Total IN</div><div class="value amount-in">${fmt(inAmt)}</div></div>
      <div class="report-kpi"><div class="label">Total OUT</div><div class="value amount-out">${fmt(outAmt)}</div></div>
      <div class="report-kpi"><div class="label">Expenses</div><div class="value amount-out">${fmt(expense)}</div></div>
      <div class="report-kpi"><div class="label">Invested</div><div class="value" style="color:var(--accent)">${fmt(invested)}</div></div>
      <div class="report-kpi"><div class="label">Net Savings</div><div class="value" style="color:${savings>=0?'var(--green)':'var(--red)'}">${fmt(savings)}</div></div>
    </div>
    <table class="data-table">
      <thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Flow</th><th>Amount</th><th>Notes</th></tr></thead>
      <tbody>
        ${txns.sort((a,b)=>b.date.localeCompare(a.date)).map(t => `<tr>
          <td>${fmtDate(t.date)}</td><td>${t.type}</td><td>${t.reference||'—'}</td>
          <td><span class="badge badge-${t.flow}">${t.flow.toUpperCase()}</span></td>
          <td class="${t.flow==='in'?'amount-in':'amount-out'}">${fmt(t.amount)}</td>
          <td>${t.notes||'—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  `;
}

function destroyChart(id) {
  if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}

// ── INIT ──
window.addEventListener('DOMContentLoaded', () => {
  // Set today's date on break modal default
  const cfg = loadConfig();
  if (cfg) {
    loadFromGitHub();
  } else {
    document.getElementById('config-modal').style.display = 'flex';
  }
});
