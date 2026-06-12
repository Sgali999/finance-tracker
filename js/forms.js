// ── FORMS ── modal definitions per section
let _editSection=null, _editId=null, _editMode=false;

const SOURCES = ['Salary','FD Maturity','PPF Withdrawal','Business Return','Loan Return','Gift','Other'];
const EXP_CATS = ['Food','Transport','Utilities','Rent','Medical','Education','Entertainment','Shopping','EMI','Other'];

const FORM_DEFS = {
  ppf:{
    icon:'🏦', title:'PPF Account',
    fields:`
      <div class="field-row c2">
        <div class="field"><label>Date</label><input type="date" name="date" required/></div>
        <div class="field"><label>Bank / Branch</label><input type="text" name="bank" placeholder="SBI, HDFC…" required/></div>
      </div>
      <div class="field-row c2">
        <div class="field"><label>Amount (₹)</label><input type="number" name="amount" placeholder="0" required/></div>
        <div class="field"><label>Status</label>
          <select name="status"><option>Active</option><option>Closed</option></select>
        </div>
      </div>
      <div class="field"><label>From (Source of funds)</label>
        <select name="source"><option value="">Select source</option>${SOURCES.map(s=>`<option>${s}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Other Details</label><textarea name="details" placeholder="Account number, nominee, maturity year…"></textarea></div>
    `
  },
  fd:{
    icon:'🏧', title:'Fixed Deposit',
    fields:`
      <div class="field-hint">💡 Interest is auto-calculated from investment date to today using simple interest.</div>
      <div class="field-row c3">
        <div class="field"><label>Date</label><input type="date" name="date" required/></div>
        <div class="field"><label>FD Number</label><input type="text" name="fdNumber" placeholder="FD/2024/001"/></div>
        <div class="field"><label>Bank</label><input type="text" name="bank" placeholder="SBI, HDFC…" required/></div>
      </div>
      <div class="field-row c3">
        <div class="field"><label>Amount (₹)</label><input type="number" name="amount" placeholder="0" required/></div>
        <div class="field"><label>Interest Rate (% / yr)</label><input type="number" name="rate" placeholder="7.5" step="0.01"/></div>
        <div class="field"><label>Status</label>
          <select name="status"><option>Active</option><option>Broken</option><option>Matured</option></select>
        </div>
      </div>
      <div class="field"><label>From (Source of funds)</label>
        <select name="source"><option value="">Select source</option>${SOURCES.map(s=>`<option>${s}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Other Details</label><textarea name="details" placeholder="Maturity date, tenure, nominee…"></textarea></div>
    `
  },
  business:{
    icon:'💼', title:'Business Investment',
    fields:`
      <div class="field-hint">💡 Interest / returns are auto-calculated from investment date to today.</div>
      <div class="field-row c2">
        <div class="field"><label>Date</label><input type="date" name="date" required/></div>
        <div class="field"><label>Business Name</label><input type="text" name="name" placeholder="Business / Partner name" required/></div>
      </div>
      <div class="field-row c3">
        <div class="field"><label>Investment Amount (₹)</label><input type="number" name="amount" placeholder="0" required/></div>
        <div class="field"><label>Rate (% / yr)</label><input type="number" name="rate" placeholder="12" step="0.01"/></div>
        <div class="field"><label>Status</label>
          <select name="status"><option>Active</option><option>Closed</option></select>
        </div>
      </div>
      <div class="field"><label>From (Source of funds)</label>
        <select name="source"><option value="">Select source</option>${SOURCES.map(s=>`<option>${s}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Other Details</label><textarea name="details" placeholder="Agreement details, partners, terms…"></textarea></div>
    `
  },
  outside:{
    icon:'🤝', title:'Outside Given Amount',
    fields:`
      <div class="field-hint">💡 Interest earned is auto-calculated from date given to today.</div>
      <div class="field-row c2">
        <div class="field"><label>Date Given</label><input type="date" name="date" required/></div>
        <div class="field"><label>Person Name</label><input type="text" name="person" placeholder="Full name" required/></div>
      </div>
      <div class="field-row c3">
        <div class="field"><label>Amount Given (₹)</label><input type="number" name="amount" placeholder="0" required/></div>
        <div class="field"><label>Interest Rate (% / yr)</label><input type="number" name="rate" placeholder="18" step="0.01"/></div>
        <div class="field"><label>Status</label>
          <select name="status"><option>Active</option><option>Returned</option></select>
        </div>
      </div>
      <div class="field"><label>From (Source of funds)</label>
        <select name="source"><option value="">Select source</option>${SOURCES.map(s=>`<option>${s}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Other Details</label><textarea name="details" placeholder="Reason, agreement, guarantor…"></textarea></div>
    `
  },
  stocks:{
    icon:'📈', title:'Stock Investment',
    fields:`
      <div class="field-row c2">
        <div class="field"><label>Date</label><input type="date" name="date" required/></div>
        <div class="field"><label>Stock Name / Ticker</label><input type="text" name="name" placeholder="RELIANCE, TCS…" required/></div>
      </div>
      <div class="field-row c2">
        <div class="field"><label>Amount Invested (₹)</label><input type="number" name="amount" placeholder="0" required/></div>
        <div class="field"><label>Status</label>
          <select name="status"><option>Active</option><option>Sold</option></select>
        </div>
      </div>
      <div class="field"><label>Other Details</label><textarea name="details" placeholder="Broker, quantity, price per share, demat account…"></textarea></div>
    `
  },
  mf:{
    icon:'💹', title:'Mutual Fund',
    fields:`
      <div class="field-row c2">
        <div class="field"><label>Date</label><input type="date" name="date" required/></div>
        <div class="field"><label>Fund Name</label><input type="text" name="name" placeholder="Axis Bluechip, SBI Nifty…" required/></div>
      </div>
      <div class="field-row c2">
        <div class="field"><label>Amount Invested (₹)</label><input type="number" name="amount" placeholder="0" required/></div>
        <div class="field"><label>Status</label>
          <select name="status"><option>Active</option><option>Redeemed</option></select>
        </div>
      </div>
      <div class="field"><label>Other Details</label><textarea name="details" placeholder="Folio number, SIP amount, frequency, AMC…"></textarea></div>
    `
  },
  lic:{
    icon:'🛡️', title:'LIC Policy',
    fields:`
      <div class="field-row c2">
        <div class="field"><label>Date</label><input type="date" name="date" required/></div>
        <div class="field"><label>LIC Name / Policy No.</label><input type="text" name="name" placeholder="Jeevan Anand – 123456789" required/></div>
      </div>
      <div class="field-row c2">
        <div class="field"><label>Premium Amount (₹)</label><input type="number" name="amount" placeholder="0" required/></div>
        <div class="field"><label>Status</label>
          <select name="status"><option>Active</option><option>Closed</option></select>
        </div>
      </div>
      <div class="field"><label>Other Details</label><textarea name="details" placeholder="Sum assured, maturity date, nominee, frequency…"></textarea></div>
    `
  },
  expenses:{
    icon:'🧾', title:'Monthly Expense',
    fields:`
      <div class="field-row c2">
        <div class="field"><label>Date</label><input type="date" name="date" required/></div>
        <div class="field"><label>Expense Name</label><input type="text" name="name" placeholder="Electricity bill, Groceries…" required/></div>
      </div>
      <div class="field-row c2">
        <div class="field"><label>Category</label>
          <select name="category"><option value="">Select category</option>${EXP_CATS.map(c=>`<option>${c}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Amount (₹)</label><input type="number" name="amount" placeholder="0" required/></div>
      </div>
      <div class="field"><label>Notes</label><input type="text" name="notes" placeholder="Optional notes"/></div>
    `
  },
  salary:{
    icon:'💰', title:'Salary / Income',
    fields:`
      <div class="field-row c2">
        <div class="field"><label>Date Received</label><input type="date" name="date" required/></div>
        <div class="field"><label>For Month</label><input type="month" name="month"/></div>
      </div>
      <div class="field-row c2">
        <div class="field"><label>Type</label>
          <select name="type">
            <option>Salary</option><option>Bonus</option><option>Interest Received</option>
            <option>Investment Return</option><option>Freelance</option><option>Other Income</option>
          </select>
        </div>
        <div class="field"><label>Amount (₹)</label><input type="number" name="amount" placeholder="0" required/></div>
      </div>
      <div class="field"><label>Source / Company</label><input type="text" name="source" placeholder="Company name, bank…"/></div>
      <div class="field"><label>Notes</label><input type="text" name="notes" placeholder="Optional"/></div>
    `
  }
};


function openEditModal(section, id){
  const def=FORM_DEFS[section]; const rec=dbGet(section,id); if(!def||!rec) return;
  _editSection=section; _editId=id; _editMode=true;
  document.getElementById('em-icon').textContent=def.icon;
  document.getElementById('em-title').textContent='Edit '+def.title;
  document.getElementById('em-body').innerHTML=def.fields;
  document.getElementById('em-err').style.display='none';
  // fill values
  Object.keys(rec).forEach(k=>{
    const el=document.querySelector(`#em-body [name="${k}"]`);
    if(el) el.value=rec[k]??'';
  });
  document.getElementById('modal-entry').style.display='flex';
}

function closeEntryModal(){ document.getElementById('modal-entry').style.display='none'; }

function saveEntry(){
  const errEl=document.getElementById('em-err');
  errEl.style.display='none';
  const inputs=document.querySelectorAll('#em-body [name]');
  const data={};
  inputs.forEach(el=>{ data[el.name]=el.type==='number'?(+el.value||0):el.value; });

  // validate required — loans use 'principal', others use 'amount'
  const amountVal = data.amount > 0 || data.principal > 0;
  if(!data.date || !amountVal){
    errEl.textContent='Date and Amount are required.';
    errEl.style.display='block'; return;
  }
  if(_editMode){ dbUpdate(_editSection,_editId,data); }
  else { dbAdd(_editSection,data); }
  closeEntryModal();
  renderSection(_editSection);
  renderDashboard();
  showToast(_editMode?'✓ Updated':'✓ Entry saved');
  ghSync();
}

// ── BREAK MODAL ──
let _brkSection=null, _brkId=null;

function openBreakModal(section, id){
  const rec=dbGet(section,id); if(!rec) return;
  _brkSection=section; _brkId=id;
  const nameField=rec.bank||rec.name||rec.person||rec.fdNumber||'';
  document.getElementById('brk-info').innerHTML=`<strong>${nameField}</strong><br>Invested: <strong>${fmt(rec.amount)}</strong> on ${fmtD(rec.date)}`;
  document.getElementById('brk-amount').value=rec.amount||'';
  document.getElementById('brk-date').value=new Date().toISOString().slice(0,10);
  document.getElementById('brk-reinvest').value='';
  document.getElementById('brk-note').value='';
  document.getElementById('brk-remarks').value='';
  document.getElementById('modal-break').style.display='flex';
}
function closeBreakModal(){ document.getElementById('modal-break').style.display='none'; _brkSection=_brkId=null; }

function confirmBreak(){
  if(!_brkSection||!_brkId) return;
  const statusMap={ppf:'Closed',fd:'Broken',business:'Closed',outside:'Returned',stocks:'Sold',mf:'Redeemed',lic:'Closed'};
  dbUpdate(_brkSection, _brkId, {
    status: statusMap[_brkSection]||'Closed',
    brokenDate: document.getElementById('brk-date').value,
    brokenAmount: +document.getElementById('brk-amount').value||0,
    reinvestedInto: document.getElementById('brk-reinvest').value,
    reinvestNote: document.getElementById('brk-note').value,
    details: (dbGet(_brkSection,_brkId)?.details||'') + ' | Closed: '+document.getElementById('brk-remarks').value
  });
  closeBreakModal();
  renderSection(_brkSection);
  renderDashboard();
  showToast('✓ Investment closed');
  ghSync();
}

// ── DELETE ──
let _delSection=null, _delId=null;
function openDeleteModal(section,id){
  _delSection=section; _delId=id;
  const rec=dbGet(section,id);
  document.getElementById('del-msg').textContent='Delete: '+(rec?.name||rec?.bank||rec?.person||rec?.fdNumber||'this entry')+'?';
  document.getElementById('modal-del').style.display='flex';
}
function confirmDelete(){
  dbDelete(_delSection,_delId);
  document.getElementById('modal-del').style.display='none';
  renderSection(_delSection);
  renderDashboard();
  showToast('✓ Deleted');
  ghSync();
}

// ── LOAN FORM DEFS ──
FORM_DEFS['loans'] = {
  icon:'🏦', title:'Loan Taken',
  fields:`
    <div class="field-hint">⚠️ Loans are liabilities. The principal and EMI payments are deducted from your wallet balance.</div>
    <div class="field-row c2">
      <div class="field"><label>Date Taken</label><input type="date" name="date" required/></div>
      <div class="field"><label>Loan Name / Purpose</label><input type="text" name="name" placeholder="Home Loan, Car Loan…" required/></div>
    </div>
    <div class="field-row c2">
      <div class="field"><label>Lender (Bank / Person)</label><input type="text" name="lender" placeholder="SBI, HDFC, Friend…"/></div>
      <div class="field"><label>Status</label>
        <select name="status"><option>Active</option><option>Closed</option></select>
      </div>
    </div>
    <div class="field-row c3">
      <div class="field"><label>Principal Amount (₹)</label><input type="number" name="principal" placeholder="0" required/></div>
      <div class="field"><label>Interest Rate (% / yr)</label><input type="number" name="rate" placeholder="9.5" step="0.01"/></div>
      <div class="field"><label>EMI Amount (₹)</label><input type="number" name="emiAmount" placeholder="0"/></div>
    </div>
    <div class="field-row c2">
      <div class="field"><label>Tenure (months)</label><input type="number" name="tenure" placeholder="60"/></div>
    </div>
    <div class="field"><label>Notes / Details</label><textarea name="notes" placeholder="Loan account number, purpose, collateral…"></textarea></div>
  `
};

// ── SINGLE DISPATCHER — called by "+ Add Entry" button ──
// Handles built-in sections and custom sections cleanly
function openAddModal(page){
  if(!page) return;
  // Custom sections
  if(page.startsWith('custom-')){
    openCustomAddModal(page.replace('custom-',''));
    return;
  }
  // Built-in sections
  const def = FORM_DEFS[page];
  if(!def) return;
  _editSection=page; _editId=null; _editMode=false;
  document.getElementById('em-icon').textContent=def.icon;
  document.getElementById('em-title').textContent='Add '+def.title;
  document.getElementById('em-body').innerHTML=def.fields;
  document.getElementById('em-err').style.display='none';
  // Default date to today
  const dateIn=document.querySelector('#em-body input[name="date"]');
  if(dateIn) dateIn.value=new Date().toISOString().slice(0,10);
  const monthIn=document.querySelector('#em-body input[name="month"]');
  if(monthIn) monthIn.value=new Date().toISOString().slice(0,7);
  document.getElementById('modal-entry').style.display='flex';
}
