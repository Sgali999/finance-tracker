// ── DATA LAYER ──
// Sheet names in finance.xlsx
const SHEETS = {
  TRANSACTIONS: 'Transactions',
  INVESTMENTS: 'Investments',
  META: 'Meta'
};

// Investment types that go to the Investments sheet
const INVESTMENT_TYPES = ['FD','LIC','Stocks','Mutual Fund','PPF','PF','Business','Loan Given'];
const IN_TYPES = ['Salary','Interest Received','Investment Return','Other Income'];

// App state
let state = {
  transactions: [],   // {id, date, month, type, flow, amount, reference, notes}
  investments: [],    // {id, date, type, reference, amount, status, returnAmount, returnDate, reinvestedInto, reinvestNote, notes}
  meta: {},           // {setupDone: bool}
  dirty: false
};

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

// ── Parse Excel workbook → state ──
function workbookToState(wb) {
  state.transactions = [];
  state.investments = [];
  state.meta = {};

  // Transactions
  if (wb.SheetNames.includes(SHEETS.TRANSACTIONS)) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[SHEETS.TRANSACTIONS], {defval: ''});
    state.transactions = rows.map(r => ({
      id: r.id || newId(),
      date: r.date || '',
      month: r.month || '',
      type: r.type || '',
      flow: r.flow || '',
      amount: parseFloat(r.amount) || 0,
      reference: r.reference || '',
      notes: r.notes || ''
    }));
  }

  // Investments
  if (wb.SheetNames.includes(SHEETS.INVESTMENTS)) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[SHEETS.INVESTMENTS], {defval: ''});
    state.investments = rows.map(r => ({
      id: r.id || newId(),
      date: r.date || '',
      type: r.type || '',
      reference: r.reference || '',
      amount: parseFloat(r.amount) || 0,
      status: r.status || 'Active',
      returnAmount: parseFloat(r.returnAmount) || 0,
      returnDate: r.returnDate || '',
      reinvestedInto: r.reinvestedInto || '',
      reinvestNote: r.reinvestNote || '',
      notes: r.notes || ''
    }));
  }

  // Meta
  if (wb.SheetNames.includes(SHEETS.META)) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[SHEETS.META], {defval: ''});
    if (rows.length > 0) state.meta = rows[0];
  }
  state.dirty = false;
}

// ── state → Excel workbook ──
function stateToWorkbook() {
  const wb = XLSX.utils.book_new();

  // Transactions
  const txnHeaders = ['id','date','month','type','flow','amount','reference','notes'];
  const txnData = [txnHeaders, ...state.transactions.map(t =>
    txnHeaders.map(h => t[h] ?? '')
  )];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(txnData), SHEETS.TRANSACTIONS);

  // Investments
  const invHeaders = ['id','date','type','reference','amount','status','returnAmount','returnDate','reinvestedInto','reinvestNote','notes'];
  const invData = [invHeaders, ...state.investments.map(i =>
    invHeaders.map(h => i[h] ?? '')
  )];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(invData), SHEETS.INVESTMENTS);

  // Meta
  const metaData = [Object.keys(state.meta), Object.values(state.meta)];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(metaData), SHEETS.META);

  return wb;
}

// ── Helpers ──
function getActiveInvestments() {
  return state.investments.filter(i => i.status === 'Active');
}
function getInvestmentsByType(type) {
  return state.investments.filter(i => i.type === type);
}
function totalActive() {
  return getActiveInvestments().reduce((s, i) => s + i.amount, 0);
}
function totalIn(filter) {
  let txns = state.transactions.filter(t => t.flow === 'in');
  if (filter) txns = txns.filter(t => t.month === filter);
  return txns.reduce((s, t) => s + t.amount, 0);
}
function totalOut(filter) {
  let txns = state.transactions.filter(t => t.flow === 'out');
  if (filter) txns = txns.filter(t => t.month === filter);
  return txns.reduce((s, t) => s + t.amount, 0);
}
function getMonths() {
  const months = [...new Set(state.transactions.map(t => t.month).filter(Boolean))];
  return months.sort().reverse();
}

// ── Add transaction ──
function addTransaction(data) {
  const isInvestment = INVESTMENT_TYPES.includes(data.type);
  const flow = IN_TYPES.includes(data.type) ? 'in' : 'out';

  const txn = {
    id: newId(),
    date: data.date,
    month: data.month,
    type: data.type,
    flow: flow,
    amount: parseFloat(data.amount),
    reference: data.reference || '',
    notes: data.notes || ''
  };
  state.transactions.push(txn);

  // Also add to investments sheet if applicable
  if (isInvestment && flow === 'out') {
    state.investments.push({
      id: newId(),
      date: data.date,
      type: data.type,
      reference: data.reference || '',
      amount: parseFloat(data.amount),
      status: 'Active',
      returnAmount: 0,
      returnDate: '',
      reinvestedInto: '',
      reinvestNote: '',
      notes: data.notes || ''
    });
  }
  state.dirty = true;
}

// ── Break/close investment ──
function breakInvestment(investId, breakData) {
  const inv = state.investments.find(i => i.id === investId);
  if (!inv) return;
  inv.status = 'Closed';
  inv.returnAmount = parseFloat(breakData.amount) || 0;
  inv.returnDate = breakData.date;
  inv.reinvestedInto = breakData.reinvest || '';
  inv.reinvestNote = breakData.reinvestNote || '';
  inv.notes = breakData.notes || inv.notes;

  // Log return as a transaction
  state.transactions.push({
    id: newId(),
    date: breakData.date,
    month: breakData.date.slice(0,7),
    type: 'Investment Return',
    flow: 'in',
    amount: inv.returnAmount,
    reference: `${inv.type} – ${inv.reference}`,
    notes: `Closed. Reinvested: ${breakData.reinvest || 'N/A'}. ${breakData.notes || ''}`
  });
  state.dirty = true;
}

// ── Add base investment (setup) ──
function addBaseInvestment(data) {
  state.investments.push({
    id: newId(),
    date: data.date || '',
    type: data.type,
    reference: data.reference || '',
    amount: parseFloat(data.amount) || 0,
    status: 'Active',
    returnAmount: 0,
    returnDate: '',
    reinvestedInto: '',
    reinvestNote: '',
    notes: data.notes || 'Base/opening investment'
  });
  state.dirty = true;
}

function markSetupDone() {
  state.meta.setupDone = 'true';
  state.dirty = true;
}

// ── Format helpers ──
function fmt(n) {
  if (isNaN(n) || n === null) return '₹0';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
}
