// ── UI LAYER ──

// ── TOAST ──
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.borderColor = isError ? 'var(--red)' : 'var(--green)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── NAVIGATION ──
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');

  if (page === 'dashboard') renderDashboard();
  if (page === 'transactions') renderTransactions();
  if (page === 'investments') renderInvestments();
  if (page === 'reports') renderReports();
}

// ── SETUP WIZARD ──
const SETUP_CONFIGS = {
  ppf:   { label: 'PPF', type: 'PPF', fields: ['Bank/Account Name', 'Approx Value (₹)', 'Start Year'] },
  fd:    { label: 'FD',  type: 'FD',  fields: ['Bank Name', 'Amount (₹)', 'Maturity Date'] },
  lic:   { label: 'LIC', type: 'LIC', fields: ['Policy Name / Number', 'Sum Assured (₹)', 'Start Date'] },
  stocks:{ label: 'Stocks', type: 'Stocks', fields: ['Company / Broker', 'Invested Amount (₹)', 'Date'] },
  mf:    { label: 'MF',  type: 'Mutual Fund', fields: ['Fund Name', 'Invested Amount (₹)', 'Date'] },
  pf:    { label: 'PF',  type: 'PF',  fields: ['Employer / Account', 'Current Balance (₹)', 'Since Year'] },
  biz:   { label: 'Biz', type: 'Business', fields: ['Business Name', 'Invested Amount (₹)', 'Date'] },
  loans: { label: 'Loans', type: 'Loan Given', fields: ['Person Name', 'Amount (₹)', 'Date Given'] }
};

function showSetupWizard() {
  document.getElementById('setup-modal').style.display = 'flex';
  // Setup tab switching
  document.querySelectorAll('#setup-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#setup-tabs .tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
}

function addSetupEntry(key) {
  const cfg = SETUP_CONFIGS[key];
  const container = document.getElementById(`${key}-entries`);
  const id = newId();
  const row = document.createElement('div');
  row.className = 'entry-row';
  row.id = `row-${id}`;
  row.innerHTML = `
    <div class="form-group">
      <label>${cfg.fields[0]}</label>
      <input type="text" class="setup-ref" placeholder="${cfg.fields[0]}" />
    </div>
    <div class="form-group">
      <label>${cfg.fields[1]}</label>
      <input type="number" class="setup-amount" placeholder="0" />
    </div>
    <div class="form-group">
      <label>${cfg.fields[2]}</label>
      <input type="text" class="setup-date" placeholder="${cfg.fields[2]}" />
    </div>
    <button class="btn-remove" onclick="this.closest('.entry-row').remove()">✕</button>
  `;
  container.appendChild(row);
}

function saveSetup() {
  let count = 0;
  Object.keys(SETUP_CONFIGS).forEach(key => {
    const cfg = SETUP_CONFIGS[key];
    const container = document.getElementById(`${key}-entries`);
    container.querySelectorAll('.entry-row').forEach(row => {
      const ref = row.querySelector('.setup-ref')?.value.trim();
      const amt = row.querySelector('.setup-amount')?.value;
      const dt  = row.querySelector('.setup-date')?.value.trim();
      if (!amt || parseFloat(amt) <= 0) return;
      addBaseInvestment({ type: cfg.type, reference: ref, amount: amt, date: dt });
      count++;
    });
  });
  markSetupDone();
  document.getElementById('setup-modal').style.display = 'none';
  renderAll();
  showToast(`✓ Saved ${count} base investments`);
  if (state.dirty) syncToGitHub();
}

function skipSetup() {
  markSetupDone();
  document.getElementById('setup-modal').style.display = 'none';
  renderAll();
}

// ── TRANSACTION MODAL ──
let _txnDirection = 'in';

function openTxnModal(direction) {
  _txnDirection = direction;
  const modal = document.getElementById('txn-modal');
  const icon = document.getElementById('txn-modal-icon');
  const title = document.getElementById('txn-modal-title');

  if (direction === 'in') {
    icon.textContent = '💰';
    title.textContent = 'Add Income';
    document.getElementById('txn-type').value = 'Salary';
    // Show only IN types
    document.querySelectorAll('#txn-type optgroup').forEach((og, i) => {
      og.style.display = i === 0 ? '' : 'none';
    });
  } else {
    icon.textContent = '💸';
    title.textContent = 'Add Expense / Investment';
    document.getElementById('txn-type').value = 'FD';
    document.querySelectorAll('#txn-type optgroup').forEach((og, i) => {
      og.style.display = i > 0 ? '' : 'none';
    });
  }

  // Defaults
  const today = new Date().toISOString().slice(0,10);
  const month = today.slice(0,7);
  document.getElementById('txn-date').value = today;
  document.getElementById('txn-month').value = month;
  document.getElementById('txn-amount').value = '';
  document.getElementById('txn-ref').value = '';
  document.getElementById('txn-notes').value = '';
  document.getElementById('txn-error').style.display = 'none';
  updateTxnType();
  modal.style.display = 'flex';
}

function updateTxnType() {
  const type = document.getElementById('txn-type').value;
  const refLabel = document.getElementById('txn-ref-label');
  const labels = {
    Salary: 'Company Name', 'Interest Received': 'From (person/bank)',
    FD: 'Bank Name', LIC: 'Policy Name/Number', Stocks: 'Company / Broker',
    'Mutual Fund': 'Fund Name', PPF: 'Bank/Account', PF: 'Employer',
    Business: 'Business Name', 'Loan Given': 'Person Name',
    'Monthly Expense': 'Category', 'Other Expense': 'Description'
  };
  refLabel.textContent = labels[type] || 'Reference';
}

function saveTxn() {
  const date = document.getElementById('txn-date').value;
  const month = document.getElementById('txn-month').value;
  const type = document.getElementById('txn-type').value;
  const amount = document.getElementById('txn-amount').value;
  const reference = document.getElementById('txn-ref').value.trim();
  const notes = document.getElementById('txn-notes').value.trim();

  if (!date || !amount || parseFloat(amount) <= 0) {
    const el = document.getElementById('txn-error');
    el.textContent = 'Date and Amount are required.';
    el.style.display = 'block';
    return;
  }

  addTransaction({ date, month, type, amount, reference, notes });
  document.getElementById('txn-modal').style.display = 'none';
  renderAll();
  showToast('✓ Transaction saved');
  if (state.dirty) syncToGitHub();
}

// ── BREAK MODAL ──
let _breakInvId = null;

function openBreakModal(invId) {
  const inv = state.investments.find(i => i.id === invId);
  if (!inv) return;
  _breakInvId = invId;
  document.getElementById('break-info').innerHTML =
    `<strong>${inv.type}</strong> — ${inv.reference || '—'}<br>
     Invested: <strong>${fmt(inv.amount)}</strong> on ${fmtDate(inv.date)}`;
  document.getElementById('break-amount').value = inv.amount;
  document.getElementById('break-date').value = new Date().toISOString().slice(0,10);
  document.getElementById('break-reinvest').value = '';
  document.getElementById('break-reinvest-note').value = '';
  document.getElementById('break-notes').value = '';
  document.getElementById('break-modal').style.display = 'flex';
}

function closeBreakModal() {
  document.getElementById('break-modal').style.display = 'none';
  _breakInvId = null;
}

function confirmBreak() {
  if (!_breakInvId) return;
  breakInvestment(_breakInvId, {
    amount: document.getElementById('break-amount').value,
    date: document.getElementById('break-date').value,
    reinvest: document.getElementById('break-reinvest').value,
    reinvestNote: document.getElementById('break-reinvest-note').value,
    notes: document.getElementById('break-notes').value
  });
  closeBreakModal();
  renderAll();
  showToast('✓ Investment closed');
  syncToGitHub();
}
