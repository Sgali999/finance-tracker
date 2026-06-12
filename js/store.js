// ── STORE ── data model + Excel I/O + interest calc
const SHEETS = { PPF:'PPF', FD:'FD', BUSINESS:'Business', OUTSIDE:'Outside',
  STOCKS:'Stocks', MF:'MutualFunds', LIC:'LIC', EXPENSES:'Expenses', SALARY:'Salary' };

const db = {
  ppf:[], fd:[], business:[], outside:[], stocks:[], mf:[], lic:[], expenses:[], salary:[],
  custom: {}
};
let _dirty = false;

// ── ID ──
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,5); }

// ── INTEREST CALCULATION ──
// Simple interest: P * R * T / 100  where T in years from startDate to today
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
    status:r.status||'Active', source:r.source||'', details:r.details||''
  }));
  db.fd = rows(SHEETS.FD).map(r=>({
    id:r.id||uid(), date:r.date||'', fdNumber:r.fdNumber||'', bank:r.bank||'',
    amount:+r.amount||0, rate:+r.rate||0, status:r.status||'Active',
    brokenDate:r.brokenDate||'', brokenAmount:+r.brokenAmount||0,
    reinvestedInto:r.reinvestedInto||'', reinvestNote:r.reinvestNote||'',
    source:r.source||'', details:r.details||''
  }));
  db.business = rows(SHEETS.BUSINESS).map(r=>({
    id:r.id||uid(), date:r.date||'', name:r.name||'', amount:+r.amount||0,
    rate:+r.rate||0, status:r.status||'Active', source:r.source||'', details:r.details||''
  }));
  db.outside = rows(SHEETS.OUTSIDE).map(r=>({
    id:r.id||uid(), date:r.date||'', person:r.person||'', amount:+r.amount||0,
    rate:+r.rate||0, status:r.status||'Active', source:r.source||'', details:r.details||''
  }));
  db.stocks = rows(SHEETS.STOCKS).map(r=>({
    id:r.id||uid(), date:r.date||'', name:r.name||'', amount:+r.amount||0,
    status:r.status||'Active', details:r.details||''
  }));
  db.mf = rows(SHEETS.MF).map(r=>({
    id:r.id||uid(), date:r.date||'', name:r.name||'', amount:+r.amount||0,
    status:r.status||'Active', details:r.details||''
  }));
  db.lic = rows(SHEETS.LIC).map(r=>({
    id:r.id||uid(), date:r.date||'', name:r.name||'', amount:+r.amount||0,
    status:r.status||'Active', details:r.details||''
  }));
  db.expenses = rows(SHEETS.EXPENSES).map(r=>({
    id:r.id||uid(), date:r.date||'', name:r.name||'', category:r.category||'',
    amount:+r.amount||0, notes:r.notes||''
  }));
  db.salary = rows(SHEETS.SALARY).map(r=>({
    id:r.id||uid(), date:r.date||'', month:r.month||'', type:r.type||'Salary',
    amount:+r.amount||0, source:r.source||'', notes:r.notes||''
  }));
  // custom sections loaded separately after sections.js is ready
  _dirty = false;
}

// ── DB → WORKBOOK ──
function dbToWb(){
  const wb = XLSX.utils.book_new();
  function addSheet(data, name){
    if(!data.length){ XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[]]), name); return; }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), name);
  }
  addSheet(db.ppf,      SHEETS.PPF);
  addSheet(db.fd,       SHEETS.FD);
  addSheet(db.business, SHEETS.BUSINESS);
  addSheet(db.outside,  SHEETS.OUTSIDE);
  addSheet(db.stocks,   SHEETS.STOCKS);
  addSheet(db.mf,       SHEETS.MF);
  addSheet(db.lic,      SHEETS.LIC);
  addSheet(db.expenses, SHEETS.EXPENSES);
  addSheet(db.salary,   SHEETS.SALARY);
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
function thisYearIncome(){
  const y=new Date().getFullYear()+'';
  return db.salary.filter(r=>r.date.startsWith(y)).reduce((s,r)=>s+r.amount,0);
}
function thisYearExpenses(){
  const y=new Date().getFullYear()+'';
  return db.expenses.filter(r=>r.date.startsWith(y)).reduce((s,r)=>s+r.amount,0);
}

// ── FORMAT helpers ──
function fmt(n){ return '₹'+(Math.round(n)||0).toLocaleString('en-IN'); }
function fmtD(d){ if(!d)return '—'; try{ return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }catch(e){ return d; } }
function fmtRate(r){ return r?(r+'% /yr'):'—'; }
