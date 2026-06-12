// ── STORE ── data model + Excel I/O + interest calc
const SHEETS = { PPF:'PPF', FD:'FD', BUSINESS:'Business', OUTSIDE:'Outside',
  STOCKS:'Stocks', MF:'MutualFunds', LIC:'LIC', EXPENSES:'Expenses', SALARY:'Salary',
  LOANS:'Loans', LOAN_PMTS:'LoanPayments', CASHFLOW:'CashFlow' };

const db = {
  ppf:[], fd:[], business:[], outside:[], stocks:[], mf:[], lic:[],
  expenses:[], salary:[], loans:[], loanPayments:[], cashflow:[],
  custom: {}
};
let _dirty = false;

// ── ID ──
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,5); }

// ── INTEREST CALCULATION ── Simple interest P*R*T/100
function calcInterest(amount, ratePerYear, startDate){
  if(!amount || !ratePerYear || !startDate) return 0;
  const start = new Date(startDate);
  const now   = new Date();
  if(isNaN(start) || start > now) return 0;
  const years = (now - start) / (1000*60*60*24*365.25);
  return Math.round(amount * ratePerYear * years / 100);
}

// ── WORKBOOK → DB ──
function wbToDb(wb){
  function rows(sheet){ return wb.SheetNames.includes(sheet) ? XLSX.utils.sheet_to_json(wb.Sheets[sheet],{defval:''}) : []; }
  db.ppf = rows(SHEETS.PPF).map(r=>({
    id:r.id||uid(), date:r.date||'', bank:r.bank||'', amount:+r.amount||0,
    status:r.status||'Active', source:r.source||'', details:r.details||'',
    returnDate:r.returnDate||'', returnAmount:+r.returnAmount||0, returnInterest:+r.returnInterest||0,
    reinvestedInto:r.reinvestedInto||'', reinvestNote:r.reinvestNote||''
  }));
  db.fd = rows(SHEETS.FD).map(r=>({
    id:r.id||uid(), date:r.date||'', fdNumber:r.fdNumber||'', bank:r.bank||'',
    amount:+r.amount||0, rate:+r.rate||0, status:r.status||'Active',
    brokenDate:r.brokenDate||'', brokenAmount:+r.brokenAmount||0,
    returnDate:r.returnDate||r.brokenDate||'', returnAmount:+r.returnAmount||0, returnInterest:+r.returnInterest||0,
    reinvestedInto:r.reinvestedInto||'', reinvestNote:r.reinvestNote||'',
    source:r.source||'', details:r.details||''
  }));
  db.business = rows(SHEETS.BUSINESS).map(r=>({
    id:r.id||uid(), date:r.date||'', name:r.name||'', amount:+r.amount||0,
    rate:+r.rate||0, status:r.status||'Active', source:r.source||'', details:r.details||'',
    returnDate:r.returnDate||'', returnAmount:+r.returnAmount||0, returnInterest:+r.returnInterest||0,
    reinvestedInto:r.reinvestedInto||'', reinvestNote:r.reinvestNote||''
  }));
  db.outside = rows(SHEETS.OUTSIDE).map(r=>({
    id:r.id||uid(), date:r.date||'', person:r.person||'', amount:+r.amount||0,
    rate:+r.rate||0, status:r.status||'Active', source:r.source||'', details:r.details||'',
    returnDate:r.returnDate||'', returnAmount:+r.returnAmount||0, returnInterest:+r.returnInterest||0,
    reinvestedInto:r.reinvestedInto||'', reinvestNote:r.reinvestNote||''
  }));
  db.stocks = rows(SHEETS.STOCKS).map(r=>({
    id:r.id||uid(), date:r.date||'', name:r.name||'', amount:+r.amount||0,
    status:r.status||'Active', details:r.details||'',
    returnDate:r.returnDate||'', returnAmount:+r.returnAmount||0, returnInterest:+r.returnInterest||0,
    reinvestedInto:r.reinvestedInto||'', reinvestNote:r.reinvestNote||''
  }));
  db.mf = rows(SHEETS.MF).map(r=>({
    id:r.id||uid(), date:r.date||'', name:r.name||'', amount:+r.amount||0,
    status:r.status||'Active', details:r.details||'',
    returnDate:r.returnDate||'', returnAmount:+r.returnAmount||0, returnInterest:+r.returnInterest||0,
    reinvestedInto:r.reinvestedInto||'', reinvestNote:r.reinvestNote||''
  }));
  db.lic = rows(SHEETS.LIC).map(r=>({
    id:r.id||uid(), date:r.date||'', name:r.name||'', amount:+r.amount||0,
    status:r.status||'Active', details:r.details||'',
    returnDate:r.returnDate||'', returnAmount:+r.returnAmount||0, returnInterest:+r.returnInterest||0,
    reinvestedInto:r.reinvestedInto||'', reinvestNote:r.reinvestNote||''
  }));
  db.expenses = rows(SHEETS.EXPENSES).map(r=>({
    id:r.id||uid(), date:r.date||'', name:r.name||'', category:r.category||'',
    amount:+r.amount||0, notes:r.notes||''
  }));
  db.salary = rows(SHEETS.SALARY).map(r=>({
    id:r.id||uid(), date:r.date||'', month:r.month||'', type:r.type||'Salary',
    amount:+r.amount||0, source:r.source||'', notes:r.notes||''
  }));
  db.loans = rows(SHEETS.LOANS).map(r=>({
    id:r.id||uid(), date:r.date||'', name:r.name||'', lender:r.lender||'',
    principal:+r.principal||0, rate:+r.rate||0, emiAmount:+r.emiAmount||0,
    tenure:+r.tenure||0, status:r.status||'Active', notes:r.notes||''
  }));
  db.loanPayments = rows(SHEETS.LOAN_PMTS).map(r=>({
    id:r.id||uid(), loanId:r.loanId||'', date:r.date||'', month:r.month||'',
    amount:+r.amount||0, notes:r.notes||''
  }));
  db.cashflow = rows(SHEETS.CASHFLOW).map(r=>({
    id:r.id||uid(), date:r.date||'', month:r.month||'', type:r.type||'',
    flow:r.flow||'in', amount:+r.amount||0, description:r.description||'', linkedId:r.linkedId||''
  }));
  _dirty = false;
}

// ── DB → WORKBOOK ──
function dbToWb(){
  const wb = XLSX.utils.book_new();
  function addSheet(data, name){
    if(!data.length){ XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[]]), name); return; }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), name);
  }
  addSheet(db.ppf,          SHEETS.PPF);
  addSheet(db.fd,           SHEETS.FD);
  addSheet(db.business,     SHEETS.BUSINESS);
  addSheet(db.outside,      SHEETS.OUTSIDE);
  addSheet(db.stocks,       SHEETS.STOCKS);
  addSheet(db.mf,           SHEETS.MF);
  addSheet(db.lic,          SHEETS.LIC);
  addSheet(db.expenses,     SHEETS.EXPENSES);
  addSheet(db.salary,       SHEETS.SALARY);
  addSheet(db.loans,        SHEETS.LOANS);
  addSheet(db.loanPayments, SHEETS.LOAN_PMTS);
  addSheet(db.cashflow,     SHEETS.CASHFLOW);
  if(typeof writeCustomSheetsToWb === 'function') writeCustomSheetsToWb(wb);
  return wb;
}

// ── CRUD helpers ──
function dbAdd(section, record){ db[section].push({id:uid(), ...record}); _dirty=true; }
function dbUpdate(section, id, updates){
  const i = db[section].findIndex(r=>r.id===id);
  if(i>-1){ db[section][i]={...db[section][i],...updates}; _dirty=true; }
}
function dbDelete(section, id){ db[section]=db[section].filter(r=>r.id!==id); _dirty=true; }
function dbGet(section, id){ return db[section].find(r=>r.id===id); }

// ── LOAN HELPERS ──
function loanOutstanding(loan){
  const paid = db.loanPayments.filter(p=>p.loanId===loan.id).reduce((s,p)=>s+p.amount,0);
  return Math.max(0, loan.principal - paid);
}
function totalLoanOutstanding(){
  return db.loans.filter(l=>l.status==='Active').reduce((s,l)=>s+loanOutstanding(l),0);
}
function thisMonthLoanPayments(){
  const m = new Date().toISOString().slice(0,7);
  return db.loanPayments.filter(p=>p.month===m).reduce((s,p)=>s+p.amount,0);
}

// ── WALLET SETTINGS ── (start date + opening balance)
function getWalletSettings(){
  try { return JSON.parse(localStorage.getItem('nf_wallet_settings')||'{}'); }
  catch(e){ return {}; }
}
function saveWalletSettings(s){ localStorage.setItem('nf_wallet_settings', JSON.stringify(s)); }

// ── CASH FLOW WALLET BALANCE ──
// Logic:
//   INFLOW  = opening balance + salary + closed investment returns (principal + interest)
//   OUTFLOW = investments made + expenses + loan EMIs + deductions
//   Closed investment outflow is CANCELLED by its return inflow
function calcWalletBalance(){
  const settings = getWalletSettings();
  const startDate = settings.startDate || '';
  const openingBalance = parseFloat(settings.openingBalance) || 0;
  function afterStart(d){ return !startDate || !d || d >= startDate; }

  let inflow = openingBalance, outflow = 0;

  // ── INFLOW ──
  // Salary & income
  db.salary.filter(r=>afterStart(r.date)).forEach(r=>inflow+=r.amount);

  // Returns from ALL closed investments (principal returned + interest received)
  const investKeys = ['ppf','fd','business','outside','stocks','mf','lic'];
  investKeys.forEach(k=>{
    db[k].filter(r=>r.status!=='Active' && r.returnDate && afterStart(r.returnDate)).forEach(r=>{
      inflow += (r.returnAmount||0) + (r.returnInterest||0);
    });
    // backward compat: FD that used old brokenAmount field with no returnAmount
    if(k==='fd'){
      db.fd.filter(r=>r.status!=='Active' && r.brokenAmount>0 && !r.returnAmount && afterStart(r.brokenDate)).forEach(r=>{
        inflow += r.brokenAmount;
      });
    }
  });

  // ── OUTFLOW ──
  // Investments made (only count active ones as outflow; closed ones are self-cancelling via inflow)
  investKeys.forEach(k=>{
    db[k].filter(r=>afterStart(r.date)).forEach(r=>outflow+=r.amount);
  });
  // Monthly expenses
  db.expenses.filter(r=>afterStart(r.date)).forEach(r=>outflow+=r.amount);
  // Loan EMI payments
  db.loanPayments.filter(p=>afterStart(p.date)).forEach(p=>outflow+=p.amount);
  // Custom investment sections
  if(typeof loadCustomDefs==='function'){
    loadCustomDefs().forEach(def=>{
      const amtCols=def.columns.filter(c=>c.type==='number');
      const dateCol=def.columns.find(c=>c.type==='date');
      const isDeduction=def.sectionType==='deduction';
      // both investment and deduction custom sections are outflow
      (db.custom[def.id]||[]).filter(r=>afterStart(dateCol?r[dateCol.key]:'')).forEach(r=>{
        amtCols.forEach(col=>{ outflow+=parseFloat(r[col.key])||0; });
      });
    });
  }
  return { inflow, outflow, balance: inflow - outflow, startDate, openingBalance };
}

// month-wise wallet for chart
function monthlyWallet(){
  const settings = getWalletSettings();
  const startDate = settings.startDate || '';
  function afterStart(d){ return !startDate || !d || d >= startDate; }
  const map = {};
  function add(month, flow, amt){
    if(!month||!amt) return;
    if(!map[month]) map[month]={in:0,out:0};
    map[month][flow] += amt;
  }
  // Salary in
  db.salary.filter(r=>afterStart(r.date)).forEach(r=>add(r.month||r.date.slice(0,7),'in',r.amount));
  // Investment returns (all sections)
  ['ppf','fd','business','outside','stocks','mf','lic'].forEach(k=>{
    db[k].filter(r=>r.status!=='Active'&&r.returnDate&&afterStart(r.returnDate)).forEach(r=>{
      add(r.returnDate.slice(0,7),'in',(r.returnAmount||0)+(r.returnInterest||0));
    });
    if(k==='fd'){
      db.fd.filter(r=>r.status!=='Active'&&r.brokenAmount>0&&!r.returnAmount&&afterStart(r.brokenDate)).forEach(r=>{
        add(r.brokenDate?.slice(0,7)||'','in',r.brokenAmount);
      });
    }
  });
  // Investments out
  ['ppf','fd','business','outside','stocks','mf','lic'].forEach(k=>{
    db[k].filter(r=>afterStart(r.date)).forEach(r=>add(r.date.slice(0,7),'out',r.amount));
  });
  // Expenses out
  db.expenses.filter(r=>afterStart(r.date)).forEach(r=>add(r.date.slice(0,7),'out',r.amount));
  // Loan EMIs out
  db.loanPayments.filter(p=>afterStart(p.date)).forEach(p=>add(p.month||p.date.slice(0,7),'out',p.amount));
  // Custom sections out
  if(typeof loadCustomDefs==='function'){
    loadCustomDefs().forEach(def=>{
      const amtCols=def.columns.filter(c=>c.type==='number');
      const dateCol=def.columns.find(c=>c.type==='date');
      (db.custom[def.id]||[]).filter(r=>afterStart(dateCol?r[dateCol.key]:'')).forEach(r=>{
        amtCols.forEach(col=>add(dateCol?r[dateCol.key]?.slice(0,7):'','out',parseFloat(r[col.key])||0));
      });
    });
  }
  return map;
}

// ── AGGREGATES ──
function totalInvested(){
  const active = r=>r.status==='Active';
  const base = ['ppf','fd','business','outside','stocks','mf','lic']
    .reduce((s,k)=>s+db[k].filter(active).reduce((a,r)=>a+r.amount,0), 0);
  const custom = typeof customSectionsTotalInvested==='function' ? customSectionsTotalInvested() : 0;
  return base + custom;
}
function totalInterestEarned(){
  let t=0;
  db.fd.filter(r=>r.status==='Active').forEach(r=>{ t+=calcInterest(r.amount,r.rate,r.date); });
  db.business.filter(r=>r.status==='Active').forEach(r=>{ t+=calcInterest(r.amount,r.rate,r.date); });
  db.outside.filter(r=>r.status==='Active').forEach(r=>{ t+=calcInterest(r.amount,r.rate,r.date); });
  return t;
}
function allTimeIncome(){
  return db.salary.reduce((s,r)=>s+r.amount,0);
}
function allTimeExpenses(){
  return db.expenses.reduce((s,r)=>s+r.amount,0);
}
// keep year-specific versions for yearly report
function yearIncome(y){ return db.salary.filter(r=>r.date.startsWith(y)).reduce((s,r)=>s+r.amount,0); }
function yearExpenses(y){ return db.expenses.filter(r=>r.date.startsWith(y)).reduce((s,r)=>s+r.amount,0); }
// legacy aliases
function thisYearIncome(){ return allTimeIncome(); }
function thisYearExpenses(){ return allTimeExpenses(); }

// ── FORMAT helpers ──
function fmt(n){ return '₹'+(Math.round(n)||0).toLocaleString('en-IN'); }
function fmtD(d){ if(!d)return '—'; try{ return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }catch(e){ return d; } }
function fmtRate(r){ return r?(r+'% /yr'):'—'; }
