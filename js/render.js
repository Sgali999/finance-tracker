// ── RENDER ── all section tables

// ── HELPERS ──
function statusBadge(s){ return `<span class="badge badge-${(s||'active').toLowerCase()}">${s||'Active'}</span>`; }
function actBtns(section,id,status){
  const isActive=['Active'].includes(status);
  return `<div class="act-btns">
    <button class="act act-edit" onclick="openEditModal('${section}','${id}')">Edit</button>
    ${isActive?`<button class="act act-close" onclick="openBreakModal('${section}','${id}')">Close</button>`:''}
    <button class="act act-del" onclick="openDeleteModal('${section}','${id}')">Del</button>
  </div>`;
}
function skpi(label,value,cls=''){
  return `<div class="skpi"><div class="skpi-l">${label}</div><div class="skpi-v ${cls}">${value}</div></div>`;
}
function empty(cols){ return `<tr class="empty-row"><td colspan="${cols}">No entries yet. Click + Add Entry to start.</td></tr>`; }

// ── PPF ──
function renderPPF(){
  const fil=document.getElementById('fil-ppf-status')?.value||'all';
  let rows=db.ppf; if(fil!=='all') rows=rows.filter(r=>r.status===fil);
  rows=[...rows].sort((a,b)=>b.date.localeCompare(a.date));
  const total=db.ppf.filter(r=>r.status==='Active').reduce((s,r)=>s+r.amount,0);
  const cnt=db.ppf.filter(r=>r.status==='Active').length;
  document.getElementById('kpi-ppf').innerHTML=
    skpi('Active Accounts',cnt,'b')+skpi('Total Invested',fmt(total),'g');
  const tbody=document.querySelector('#tbl-ppf tbody');
  tbody.innerHTML=rows.length?rows.map(r=>`<tr>
    <td>${fmtD(r.date)}</td><td>${r.bank||'—'}</td>
    <td class="amt">${fmt(r.amount)}</td><td>${statusBadge(r.status)}</td>
    <td>${r.status!=='Active'?`<span class="amt-g">+${fmt((r.returnAmount||0)+(r.returnInterest||0))}</span>`:'—'}</td>
    <td>${r.source||'—'}</td><td title="${r.details||''}">${(r.details||'—').slice(0,35)}${(r.details||'').length>35?'…':''}</td>
    <td>${actBtns('ppf',r.id,r.status)}</td>
  </tr>`).join(''):empty(8);
}

// ── FD ──
function renderFD(){
  const fil=document.getElementById('fil-fd-status')?.value||'all';
  let rows=db.fd; if(fil!=='all') rows=rows.filter(r=>r.status===fil);
  rows=[...rows].sort((a,b)=>b.date.localeCompare(a.date));
  const active=db.fd.filter(r=>r.status==='Active');
  const totalInv=active.reduce((s,r)=>s+r.amount,0);
  const totalInt=active.reduce((s,r)=>s+calcInterest(r.amount,r.rate,r.date),0);
  document.getElementById('kpi-fd').innerHTML=
    skpi('Active FDs',active.length,'b')+skpi('Total Invested',fmt(totalInv),'g')+skpi('Interest Earned (Live)',fmt(totalInt),'gold');
  const tbody=document.querySelector('#tbl-fd tbody');
  tbody.innerHTML=rows.length?rows.map(r=>{
    const liveInterest=calcInterest(r.amount,r.rate,r.date);
    const reinvest=r.reinvestedInto?`<span class="reinvest-tag">→ ${r.reinvestedInto}</span> ${r.reinvestNote||''}`:r.status!=='Active'?'To Wallet':'—';
    const returnCol = r.status!=='Active'
      ? `<span class="amt-g">+${fmt((r.returnAmount||0)+(r.returnInterest||0))}</span><br><small style="color:var(--muted)">P:${fmt(r.returnAmount||0)} I:${fmt(r.returnInterest||0)}</small>`
      : `<span class="interest-live">${fmt(liveInterest)}</span>`;
    return `<tr>
      <td>${fmtD(r.date)}</td><td>${r.fdNumber||'—'}</td><td>${r.bank||'—'}</td>
      <td class="amt">${fmt(r.amount)}</td><td>${fmtRate(r.rate)}</td>
      <td>${returnCol}</td>
      <td>${statusBadge(r.status)}</td>
      <td style="font-size:.72rem">${reinvest}</td>
      <td>${r.source||'—'}</td>
      <td title="${r.details||''}">${(r.details||'—').slice(0,25)}${(r.details||'').length>25?'…':''}</td>
      <td>${actBtns('fd',r.id,r.status)}</td>
    </tr>`;
  }).join(''):empty(11);
}

// ── BUSINESS ──
function renderBusiness(){
  const fil=document.getElementById('fil-business-status')?.value||'all';
  let rows=db.business; if(fil!=='all') rows=rows.filter(r=>r.status===fil);
  rows=[...rows].sort((a,b)=>b.date.localeCompare(a.date));
  const active=db.business.filter(r=>r.status==='Active');
  const totalInv=active.reduce((s,r)=>s+r.amount,0);
  const totalInt=active.reduce((s,r)=>s+calcInterest(r.amount,r.rate,r.date),0);
  document.getElementById('kpi-business').innerHTML=
    skpi('Active',active.length,'b')+skpi('Total Invested',fmt(totalInv),'g')+skpi('Returns Earned (Live)',fmt(totalInt),'gold');
  const tbody=document.querySelector('#tbl-business tbody');
  tbody.innerHTML=rows.length?rows.map(r=>{
    const liveInterest=calcInterest(r.amount,r.rate,r.date);
    const returnCol = r.status!=='Active'
      ? `<span class="amt-g">+${fmt((r.returnAmount||0)+(r.returnInterest||0))}</span><br><small style="color:var(--muted)">P:${fmt(r.returnAmount||0)} I:${fmt(r.returnInterest||0)}</small>`
      : `<span class="interest-live">${fmt(liveInterest)}</span>`;
    return `<tr>
      <td>${fmtD(r.date)}</td><td>${r.name||'—'}</td>
      <td class="amt">${fmt(r.amount)}</td><td>${fmtRate(r.rate)}</td>
      <td>${returnCol}</td>
      <td>${statusBadge(r.status)}</td><td>${r.source||'—'}</td>
      <td title="${r.details||''}">${(r.details||'—').slice(0,25)}${(r.details||'').length>25?'…':''}</td>
      <td>${actBtns('business',r.id,r.status)}</td>
    </tr>`;
  }).join(''):empty(9);
}

// ── OUTSIDE GIVEN ──
function renderOutside(){
  const fil=document.getElementById('fil-outside-status')?.value||'all';
  let rows=db.outside; if(fil!=='all') rows=rows.filter(r=>r.status===fil);
  rows=[...rows].sort((a,b)=>b.date.localeCompare(a.date));
  const active=db.outside.filter(r=>r.status==='Active');
  const totalGiven=active.reduce((s,r)=>s+r.amount,0);
  const totalInt=active.reduce((s,r)=>s+calcInterest(r.amount,r.rate,r.date),0);
  document.getElementById('kpi-outside').innerHTML=
    skpi('Active',active.length,'b')+skpi('Total Given',fmt(totalGiven),'g')+skpi('Interest Earned (Live)',fmt(totalInt),'gold');
  const tbody=document.querySelector('#tbl-outside tbody');
  tbody.innerHTML=rows.length?rows.map(r=>{
    const liveInterest=calcInterest(r.amount,r.rate,r.date);
    const returnCol = r.status!=='Active'
      ? `<span class="amt-g">+${fmt((r.returnAmount||0)+(r.returnInterest||0))}</span><br><small style="color:var(--muted)">P:${fmt(r.returnAmount||0)} I:${fmt(r.returnInterest||0)}</small>`
      : `<span class="interest-live">${fmt(liveInterest)}</span>`;
    return `<tr>
      <td>${fmtD(r.date)}</td><td>${r.person||'—'}</td>
      <td class="amt">${fmt(r.amount)}</td><td>${fmtRate(r.rate)}</td>
      <td>${returnCol}</td>
      <td>${statusBadge(r.status)}</td><td>${r.source||'—'}</td>
      <td title="${r.details||''}">${(r.details||'—').slice(0,25)}${(r.details||'').length>25?'…':''}</td>
      <td>${actBtns('outside',r.id,r.status)}</td>
    </tr>`;
  }).join(''):empty(9);
}

// ── STOCKS ──
function renderStocks(){
  const fil=document.getElementById('fil-stocks-status')?.value||'all';
  let rows=db.stocks; if(fil!=='all') rows=rows.filter(r=>r.status===fil);
  rows=[...rows].sort((a,b)=>b.date.localeCompare(a.date));
  const active=db.stocks.filter(r=>r.status==='Active');
  const total=active.reduce((s,r)=>s+r.amount,0);
  document.getElementById('kpi-stocks').innerHTML=
    skpi('Active Holdings',active.length,'b')+skpi('Total Invested',fmt(total),'g');
  const tbody=document.querySelector('#tbl-stocks tbody');
  tbody.innerHTML=rows.length?rows.map(r=>`<tr>
    <td>${fmtD(r.date)}</td><td>${r.name||'—'}</td>
    <td class="amt">${fmt(r.amount)}</td><td>${statusBadge(r.status)}</td>
    <td title="${r.details||''}">${(r.details||'—').slice(0,40)}${r.details?.length>40?'…':''}</td>
    <td>${actBtns('stocks',r.id,r.status)}</td>
  </tr>`).join(''):empty(6);
}

// ── MUTUAL FUNDS ──
function renderMF(){
  const fil=document.getElementById('fil-mf-status')?.value||'all';
  let rows=db.mf; if(fil!=='all') rows=rows.filter(r=>r.status===fil);
  rows=[...rows].sort((a,b)=>b.date.localeCompare(a.date));
  const active=db.mf.filter(r=>r.status==='Active');
  const total=active.reduce((s,r)=>s+r.amount,0);
  document.getElementById('kpi-mf').innerHTML=
    skpi('Active Funds',active.length,'b')+skpi('Total Invested',fmt(total),'g');
  const tbody=document.querySelector('#tbl-mf tbody');
  tbody.innerHTML=rows.length?rows.map(r=>`<tr>
    <td>${fmtD(r.date)}</td><td>${r.name||'—'}</td>
    <td class="amt">${fmt(r.amount)}</td><td>${statusBadge(r.status)}</td>
    <td title="${r.details||''}">${(r.details||'—').slice(0,40)}${r.details?.length>40?'…':''}</td>
    <td>${actBtns('mf',r.id,r.status)}</td>
  </tr>`).join(''):empty(6);
}

// ── LIC ──
function renderLIC(){
  const fil=document.getElementById('fil-lic-status')?.value||'all';
  let rows=db.lic; if(fil!=='all') rows=rows.filter(r=>r.status===fil);
  rows=[...rows].sort((a,b)=>b.date.localeCompare(a.date));
  const active=db.lic.filter(r=>r.status==='Active');
  const total=active.reduce((s,r)=>s+r.amount,0);
  document.getElementById('kpi-lic').innerHTML=
    skpi('Active Policies',active.length,'b')+skpi('Total Premium',fmt(total),'g');
  const tbody=document.querySelector('#tbl-lic tbody');
  tbody.innerHTML=rows.length?rows.map(r=>`<tr>
    <td>${fmtD(r.date)}</td><td>${r.name||'—'}</td>
    <td class="amt">${fmt(r.amount)}</td><td>${statusBadge(r.status)}</td>
    <td title="${r.details||''}">${(r.details||'—').slice(0,40)}${r.details?.length>40?'…':''}</td>
    <td>${actBtns('lic',r.id,r.status)}</td>
  </tr>`).join(''):empty(6);
}

// ── EXPENSES ──
function renderExpenses(){
  const filMonth=document.getElementById('fil-exp-month')?.value||'';
  const filCat=document.getElementById('fil-exp-cat')?.value||'all';
  let rows=db.expenses;
  if(filMonth) rows=rows.filter(r=>r.date.startsWith(filMonth));
  if(filCat!=='all') rows=rows.filter(r=>r.category===filCat);
  rows=[...rows].sort((a,b)=>b.date.localeCompare(a.date));
  const total=rows.reduce((s,r)=>s+r.amount,0);
  const thisM=db.expenses.filter(r=>r.date.startsWith(new Date().toISOString().slice(0,7))).reduce((s,r)=>s+r.amount,0);
  document.getElementById('kpi-expenses').innerHTML=
    skpi('This Month',fmt(thisM),'r')+skpi('Filtered Total',fmt(total),'r')+skpi('Entries',rows.length,'b');
  // populate category filter
  const cats=[...new Set(db.expenses.map(r=>r.category).filter(Boolean))];
  const catSel=document.getElementById('fil-exp-cat');
  if(catSel){
    const cur=catSel.value;
    catSel.innerHTML='<option value="all">All Categories</option>'+cats.map(c=>`<option>${c}</option>`).join('');
    if(cur) catSel.value=cur;
  }
  const tbody=document.querySelector('#tbl-expenses tbody');
  tbody.innerHTML=rows.length?rows.map(r=>`<tr>
    <td>${fmtD(r.date)}</td><td>${r.name||'—'}</td>
    <td>${r.category||'—'}</td><td class="amt amt-g">${fmt(r.amount)}</td>
    <td>${r.notes||'—'}</td>
    <td><div class="act-btns">
      <button class="act act-edit" onclick="openEditModal('expenses','${r.id}')">Edit</button>
      <button class="act act-del" onclick="openDeleteModal('expenses','${r.id}')">Del</button>
    </div></td>
  </tr>`).join(''):empty(6);
}

// ── SALARY ──
function renderSalary(){
  const filMonth=document.getElementById('fil-sal-month')?.value||'';
  let rows=db.salary;
  if(filMonth) rows=rows.filter(r=>r.date.startsWith(filMonth));
  rows=[...rows].sort((a,b)=>b.date.localeCompare(a.date));
  const thisY=new Date().getFullYear()+'';
  const thisYTotal=db.salary.filter(r=>r.date.startsWith(thisY)).reduce((s,r)=>s+r.amount,0);
  const total=rows.reduce((s,r)=>s+r.amount,0);
  document.getElementById('kpi-salary').innerHTML=
    skpi('This Year Income',fmt(thisYTotal),'g')+skpi('Filtered Total',fmt(total),'g')+skpi('Entries',rows.length,'b');
  const tbody=document.querySelector('#tbl-salary tbody');
  tbody.innerHTML=rows.length?rows.map(r=>`<tr>
    <td>${fmtD(r.date)}</td><td>${r.month||'—'}</td><td>${r.type||'Salary'}</td>
    <td class="amt amt-g">${fmt(r.amount)}</td><td>${r.source||'—'}</td><td>${r.notes||'—'}</td>
    <td><div class="act-btns">
      <button class="act act-edit" onclick="openEditModal('salary','${r.id}')">Edit</button>
      <button class="act act-del" onclick="openDeleteModal('salary','${r.id}')">Del</button>
    </div></td>
  </tr>`).join(''):empty(7);
}


// ── LOANS ──
function renderLoans(){
  const fil=document.getElementById('fil-loans-status')?.value||'all';
  let rows=db.loans; if(fil!=='all') rows=rows.filter(r=>r.status===fil);
  rows=[...rows].sort((a,b)=>b.date.localeCompare(a.date));
  const active=db.loans.filter(r=>r.status==='Active');
  const totalPrincipal=active.reduce((s,r)=>s+r.principal,0);
  const totalOutstanding=active.reduce((s,r)=>s+loanOutstanding(r),0);
  const totalPaid=db.loanPayments.reduce((s,p)=>s+p.amount,0);
  document.getElementById('kpi-loans').innerHTML=
    skpi('Active Loans',active.length,'r')+
    skpi('Total Borrowed',fmt(totalPrincipal),'r')+
    skpi('Outstanding',fmt(totalOutstanding),'r')+
    skpi('Total Paid Back',fmt(totalPaid),'g');
  const tbody=document.querySelector('#tbl-loans tbody');
  tbody.innerHTML=rows.length?rows.map(r=>{
    const paid=db.loanPayments.filter(p=>p.loanId===r.id).reduce((s,p)=>s+p.amount,0);
    const outstanding=Math.max(0,r.principal-paid);
    const pct=r.principal>0?Math.round(paid/r.principal*100):0;
    return `<tr>
      <td>${fmtD(r.date)}</td><td>${r.name||'—'}</td><td>${r.lender||'—'}</td>
      <td class="amt amt-r">${fmt(r.principal)}</td>
      <td>${fmtRate(r.rate)}</td><td>${fmt(r.emiAmount)}</td>
      <td class="amt amt-g">${fmt(paid)}</td>
      <td class="amt ${outstanding>0?'amt-r':''}">${fmt(outstanding)}</td>
      <td>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <span style="font-size:.65rem;color:var(--muted)">${pct}% paid</span>
      </td>
      <td>${statusBadge(r.status)}</td>
      <td title="${r.notes||''}">${(r.notes||'—').slice(0,25)}${r.notes?.length>25?'…':''}</td>
      <td>${actBtns('loans',r.id,r.status)}</td>
    </tr>`;
  }).join(''):empty(12);
}

// ── LOAN PAYMENTS ──
function renderLoanPayments(){
  const filLoan=document.getElementById('fil-lp-loan')?.value||'all';
  const filMonth=document.getElementById('fil-lp-month')?.value||'';
  let rows=db.loanPayments;
  if(filLoan!=='all') rows=rows.filter(p=>p.loanId===filLoan);
  if(filMonth) rows=rows.filter(p=>p.month===filMonth||p.date.startsWith(filMonth));
  rows=[...rows].sort((a,b)=>b.date.localeCompare(a.date));
  // populate loan filter
  const loanSel=document.getElementById('fil-lp-loan');
  if(loanSel){
    const cur=loanSel.value;
    loanSel.innerHTML='<option value="all">All Loans</option>'+db.loans.map(l=>`<option value="${l.id}">${l.name}</option>`).join('');
    if(cur) loanSel.value=cur;
  }
  const total=rows.reduce((s,p)=>s+p.amount,0);
  document.getElementById('kpi-loanpayments').innerHTML=
    skpi('Payments',rows.length,'b')+skpi('Total Paid (filtered)',fmt(total),'g');
  const tbody=document.querySelector('#tbl-loanpayments tbody');
  tbody.innerHTML=rows.length?rows.map(p=>{
    const loan=db.loans.find(l=>l.id===p.loanId);
    return `<tr>
      <td>${fmtD(p.date)}</td><td>${p.month||'—'}</td>
      <td>${loan?loan.name:'—'}</td>
      <td class="amt amt-g">${fmt(p.amount)}</td>
      <td>${p.notes||'—'}</td>
      <td><div class="act-btns">
        <button class="act act-edit" onclick="openEditModal('loanPayments','${p.id}')">Edit</button>
        <button class="act act-del" onclick="openDeleteModal('loanPayments','${p.id}')">Del</button>
      </div></td>
    </tr>`;
  }).join(''):empty(6);
}

// ── WALLET / CASH FLOW ──
function renderWallet(){
  const {inflow,outflow,balance} = calcWalletBalance();

  // Salary this year
  const thisY=new Date().getFullYear()+'';
  const salaryY=db.salary.filter(r=>r.date.startsWith(thisY)).reduce((s,r)=>s+r.amount,0);
  // Investments this year
  const invY=['ppf','fd','business','outside','stocks','mf','lic'].reduce((s,k)=>
    s+db[k].filter(r=>r.date.startsWith(thisY)).reduce((a,r)=>a+r.amount,0),0);
  // Returns received (FD breaks)
  const returns=db.fd.filter(r=>r.brokenAmount>0).reduce((s,r)=>s+r.brokenAmount,0);
  // Loan EMIs this year
  const loanEmiY=db.loanPayments.filter(p=>p.date.startsWith(thisY)).reduce((s,p)=>s+p.amount,0);
  // Expenses this year
  const expY=db.expenses.filter(r=>r.date.startsWith(thisY)).reduce((s,r)=>s+r.amount,0);

  document.getElementById('kpi-wallet').innerHTML=
    skpi('Total Salary Received',fmt(inflow),'g')+
    skpi('Investment Returns',fmt(returns),'g')+
    skpi('Total Invested (Out)',fmt(outflow - expY - loanEmiY),'b')+
    skpi('Total Expenses',fmt(expY),'r')+
    skpi('Loan EMIs Paid',fmt(loanEmiY),'r')+
    skpi('💰 Wallet Balance',fmt(balance),balance>=0?'g':'r');

  // Month-wise breakdown table
  const mw = monthlyWallet();
  const months = Object.keys(mw).sort().reverse().slice(0,24);
  let running = inflow - outflow; // start from total
  const tbody = document.querySelector('#tbl-wallet tbody');
  if(!tbody) return;

  // Build running balance month by month (ascending)
  const ascMonths = Object.keys(mw).sort();
  let bal = 0;
  const balMap = {};
  ascMonths.forEach(m=>{ bal += mw[m].in - mw[m].out; balMap[m]=bal; });

  tbody.innerHTML = months.map(m=>{
    const net = mw[m].in - mw[m].out;
    const b = balMap[m];
    return `<tr>
      <td>${m}</td>
      <td class="amt amt-g">+${fmt(mw[m].in)}</td>
      <td class="amt amt-r">-${fmt(mw[m].out)}</td>
      <td class="amt ${net>=0?'amt-g':'amt-r'}">${net>=0?'+':''}${fmt(net)}</td>
      <td class="amt ${b>=0?'amt-g':'amt-r'}">${fmt(b)}</td>
    </tr>`;
  }).join('')||'<tr class="empty-row"><td colspan="5">No cash flow data yet. Add salary and expenses to track.</td></tr>';

  renderWalletChart(mw);
}

function renderWalletChart(mw){
  if(typeof _ch==='undefined') return;
  const months=Object.keys(mw).sort().slice(-12);
  const labels=months.map(m=>{ const d=new Date(m+'-01'); return d.toLocaleString('en-IN',{month:'short',year:'2-digit'}); });
  const inD=months.map(m=>mw[m].in);
  const outD=months.map(m=>mw[m].out);
  // running balance
  let bal=0; const balD=months.map(m=>{ bal+=mw[m].in-mw[m].out; return bal; });
  if(typeof dc==='function') dc('ch-wallet');
  const ctx=document.getElementById('ch-wallet')?.getContext('2d');
  if(!ctx) return;
  const PALETTE_=['#22c55e','#ef4444','#6366f1'];
  _ch['ch-wallet']=new Chart(ctx,{
    data:{
      labels,
      datasets:[
        {type:'bar',label:'IN',data:inD,backgroundColor:'rgba(34,197,94,.7)',borderRadius:4,yAxisID:'y'},
        {type:'bar',label:'OUT',data:outD,backgroundColor:'rgba(239,68,68,.6)',borderRadius:4,yAxisID:'y'},
        {type:'line',label:'Running Balance',data:balD,borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,.1)',
         pointBackgroundColor:'#6366f1',fill:true,tension:.3,yAxisID:'y'}
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:true,
      plugins:{legend:{labels:{color:'#7b8baa',font:{size:11}}}},
      scales:{
        x:{ticks:{color:'#7b8baa',font:{size:10}},grid:{color:'#2a3349'}},
        y:{ticks:{color:'#7b8baa',callback:v=>'₹'+v.toLocaleString('en-IN')},grid:{color:'#2a3349'}}
      }
    }
  });
}

// ── YEARLY REPORT ──
function renderYearly(selectedYear){
  // Collect all years
  const allDates=[];
  ['ppf','fd','business','outside','stocks','mf','lic'].forEach(k=>db[k].forEach(r=>r.date&&allDates.push(r.date)));
  db.expenses.forEach(r=>r.date&&allDates.push(r.date));
  db.salary.forEach(r=>r.date&&allDates.push(r.date));
  db.loans.forEach(r=>r.date&&allDates.push(r.date));
  if(typeof loadCustomDefs==='function') loadCustomDefs().forEach(def=>{
    const dc=def.columns.find(c=>c.type==='date');
    (db.custom[def.id]||[]).forEach(r=>dc&&r[dc.key]&&allDates.push(r[dc.key]));
  });
  const years=[...new Set(allDates.map(d=>(d||'').slice(0,4)).filter(y=>y.match(/^\d{4}$/)))].sort().reverse();

  const tabsEl    = document.getElementById('year-tabs');
  const contentEl = document.getElementById('year-content');

  if(!years.length){
    tabsEl.innerHTML='';
    contentEl.innerHTML='<p style="color:var(--muted);text-align:center;padding:60px;font-size:.9rem">No data yet. Add entries to see yearly reports.</p>';
    return;
  }

  const year = selectedYear || years[0];

  // ── Tabs ──
  tabsEl.innerHTML = years.map(y=>
    `<button class="year-tab ${y===year?'active':''}" onclick="renderYearly('${y}')">${y}</button>`
  ).join('');

  // ── Aggregate ──
  const ySalary   = db.salary.filter(r=>r.date.startsWith(year)).reduce((s,r)=>s+r.amount,0);
  const yExp      = db.expenses.filter(r=>r.date.startsWith(year)).reduce((s,r)=>s+r.amount,0);
  const yInvested = ['ppf','fd','business','outside','stocks','mf','lic']
    .reduce((s,k)=>s+db[k].filter(r=>r.date.startsWith(year)).reduce((a,r)=>a+r.amount,0),0);
  const yReturns  = ['ppf','fd','business','outside','stocks','mf','lic']
    .reduce((s,k)=>s+db[k].filter(r=>(r.returnDate||'').startsWith(year)&&r.status!=='Active')
      .reduce((a,r)=>a+(r.returnAmount||0)+(r.returnInterest||0),0),0);
  const yLoans    = db.loans.filter(r=>r.date.startsWith(year)).reduce((s,r)=>s+r.principal,0);
  const yNet      = ySalary + yReturns - yExp;

  // ── LEFT PANEL ──
  const summaryItems = [
    {label:'Income',    val:ySalary,   cls:'g', icon:'💰'},
    {label:'Expenses',  val:yExp,      cls:'r', icon:'🧾'},
    {label:'Invested',  val:yInvested, cls:'b', icon:'📦'},
    {label:'Returns',   val:yReturns,  cls:'g', icon:'✅'},
  ];
  if(yLoans) summaryItems.push({label:'Loans',val:yLoans,cls:'r',icon:'🏦'});

  const sectionTotals = [
    {k:'salary',   label:'Salary',    amtKey:'amount',    icon:'💰', g:true},
    {k:'fd',       label:'FD',        amtKey:'amount',    icon:'🏧'},
    {k:'ppf',      label:'PPF',       amtKey:'amount',    icon:'🏦'},
    {k:'business', label:'Business',  amtKey:'amount',    icon:'💼'},
    {k:'outside',  label:'Outside',   amtKey:'amount',    icon:'🤝'},
    {k:'stocks',   label:'Stocks',    amtKey:'amount',    icon:'📈'},
    {k:'mf',       label:'MF',        amtKey:'amount',    icon:'💹'},
    {k:'lic',      label:'LIC',       amtKey:'amount',    icon:'🛡️'},
    {k:'expenses', label:'Expenses',  amtKey:'amount',    icon:'🧾', r:true},
    {k:'loans',    label:'Loans',     amtKey:'principal', icon:'🏦', r:true},
  ];

  let secTotHtml = sectionTotals.map(s=>{
    const rows = db[s.k].filter(r=>r.date.startsWith(year));
    if(!rows.length) return '';
    const total = rows.reduce((a,r)=>a+(parseFloat(r[s.amtKey])||0),0);
    return `<div class="yr-sec-total">
      <span class="yr-sec-total-label">${s.icon} ${s.label}</span>
      <span class="yr-sec-total-val ${s.g?'g':s.r?'r':'muted'}">${fmt(total)}</span>
    </div>`;
  }).join('');

  if(typeof loadCustomDefs==='function'){
    loadCustomDefs().forEach(def=>{
      const dc=def.columns.find(c=>c.type==='date');
      const ac=def.columns.find(c=>c.type==='number');
      if(!dc||!ac) return;
      const rows=(db.custom[def.id]||[]).filter(r=>r[dc.key]?.startsWith(year));
      if(!rows.length) return;
      const total=rows.reduce((a,r)=>a+(parseFloat(r[ac.key])||0),0);
      secTotHtml+=`<div class="yr-sec-total">
        <span class="yr-sec-total-label">${def.icon} ${def.name}</span>
        <span class="yr-sec-total-val ${def.sectionType==='deduction'?'r':'muted'}">${fmt(total)}</span>
      </div>`;
    });
  }

  const leftHtml = `
    <div class="yr-left-title">${year} Summary</div>
    ${summaryItems.map(i=>`
      <div class="yr-sum-row">
        <span class="yr-sum-icon">${i.icon}</span>
        <span class="yr-sum-label">${i.label}</span>
        <span class="yr-sum-val ${i.cls}">${fmt(i.val)}</span>
      </div>`).join('')}
    <div class="yr-net-box ${yNet>=0?'g':'r'}">
      <span style="font-size:.68rem;opacity:.8">NET (Income + Returns − Expenses)</span>
      <span class="yr-net-val">${fmt(yNet)}</span>
    </div>
    <div class="yr-divider"></div>
    <div class="yr-left-subtitle">By Section</div>
    <div class="yr-sec-totals">${secTotHtml||'<div style="color:var(--muted);font-size:.72rem">No data for '+year+'</div>'}</div>`;

  // ── RIGHT PANEL — all sections ──
  let rightHtml = '';

  // Returns this year
  const closedRows=[];
  ['ppf','fd','business','outside','stocks','mf','lic'].forEach(k=>{
    db[k].filter(r=>(r.returnDate||'').startsWith(year)&&r.status!=='Active').forEach(r=>{
      closedRows.push({date:r.returnDate,name:r.bank||r.name||r.person||r.fdNumber||'',
        principal:r.returnAmount||0,interest:r.returnInterest||0,
        total:(r.returnAmount||0)+(r.returnInterest||0)});
    });
  });
  if(closedRows.length){
    rightHtml += _yCard(`✅ Returns Received — <span class="yr-count">${closedRows.length}</span>`,
      _yTable(
        [{l:'Date'},{l:'Name'},{l:'Principal',amt:true,g:true},{l:'Interest',gold:true},{l:'Total',amt:true,g:true}],
        closedRows.sort((a,b)=>b.date.localeCompare(a.date)).map(r=>[
          fmtD(r.date), r.name||'—', fmt(r.principal), fmt(r.interest), '+'+fmt(r.total)
        ]),
        [{g:false},{g:false},{g:true},{gold:true},{g:true}]
      ) + `<div class="yr-card-total g">Total: ${fmt(closedRows.reduce((s,r)=>s+r.total,0))}</div>`
    );
  }

  // Salary
  const salRows = db.salary.filter(r=>r.date.startsWith(year)).sort((a,b)=>b.date.localeCompare(a.date));
  if(salRows.length) rightHtml += _yCard(`💰 Salary / Income — <span class="yr-count">${salRows.length}</span> — <span class="yr-card-inline-total g">${fmt(salRows.reduce((s,r)=>s+r.amount,0))}</span>`,
    _yTable([{l:'Date'},{l:'Month'},{l:'Type'},{l:'Amount',amt:true,g:true},{l:'Source'}],
      salRows.map(r=>[fmtD(r.date),r.month||'—',r.type||'Salary',fmt(r.amount),r.source||'—']),
      [{},{},{},{g:true},{}]));

  // FD
  const fdRows = db.fd.filter(r=>r.date.startsWith(year)).sort((a,b)=>b.date.localeCompare(a.date));
  if(fdRows.length) rightHtml += _yCard(`🏧 Fixed Deposits — <span class="yr-count">${fdRows.length}</span> — <span class="yr-card-inline-total">${fmt(fdRows.reduce((s,r)=>s+r.amount,0))}</span>`,
    _yTable([{l:'Date'},{l:'FD No.'},{l:'Bank'},{l:'Amount',amt:true},{l:'Rate'},{l:'Status'}],
      fdRows.map(r=>[fmtD(r.date),r.fdNumber||'—',r.bank||'—',fmt(r.amount),r.rate?r.rate+'%':'—',r.status]),
      [{},{},{},{},{},{}], {statusCol:5}));

  // PPF
  const ppfRows = db.ppf.filter(r=>r.date.startsWith(year)).sort((a,b)=>b.date.localeCompare(a.date));
  if(ppfRows.length) rightHtml += _yCard(`🏦 PPF — <span class="yr-count">${ppfRows.length}</span> — <span class="yr-card-inline-total">${fmt(ppfRows.reduce((s,r)=>s+r.amount,0))}</span>`,
    _yTable([{l:'Date'},{l:'Bank'},{l:'Amount',amt:true},{l:'Status'}],
      ppfRows.map(r=>[fmtD(r.date),r.bank||'—',fmt(r.amount),r.status]),
      [{},{},{},{}], {statusCol:3}));

  // Business
  const bizRows = db.business.filter(r=>r.date.startsWith(year)).sort((a,b)=>b.date.localeCompare(a.date));
  if(bizRows.length) rightHtml += _yCard(`💼 Business — <span class="yr-count">${bizRows.length}</span> — <span class="yr-card-inline-total">${fmt(bizRows.reduce((s,r)=>s+r.amount,0))}</span>`,
    _yTable([{l:'Date'},{l:'Name'},{l:'Amount',amt:true},{l:'Rate'},{l:'Status'}],
      bizRows.map(r=>[fmtD(r.date),r.name||'—',fmt(r.amount),r.rate?r.rate+'%':'—',r.status]),
      [{},{},{},{},{}], {statusCol:4}));

  // Outside
  const outRows = db.outside.filter(r=>r.date.startsWith(year)).sort((a,b)=>b.date.localeCompare(a.date));
  if(outRows.length) rightHtml += _yCard(`🤝 Outside Given — <span class="yr-count">${outRows.length}</span> — <span class="yr-card-inline-total">${fmt(outRows.reduce((s,r)=>s+r.amount,0))}</span>`,
    _yTable([{l:'Date'},{l:'Person'},{l:'Amount',amt:true},{l:'Rate'},{l:'Status'}],
      outRows.map(r=>[fmtD(r.date),r.person||'—',fmt(r.amount),r.rate?r.rate+'%':'—',r.status]),
      [{},{},{},{},{}], {statusCol:4}));

  // Stocks
  const stkRows = db.stocks.filter(r=>r.date.startsWith(year)).sort((a,b)=>b.date.localeCompare(a.date));
  if(stkRows.length) rightHtml += _yCard(`📈 Stocks — <span class="yr-count">${stkRows.length}</span> — <span class="yr-card-inline-total">${fmt(stkRows.reduce((s,r)=>s+r.amount,0))}</span>`,
    _yTable([{l:'Date'},{l:'Stock'},{l:'Amount',amt:true},{l:'Status'}],
      stkRows.map(r=>[fmtD(r.date),r.name||'—',fmt(r.amount),r.status]),
      [{},{},{},{}], {statusCol:3}));

  // MF
  const mfRows = db.mf.filter(r=>r.date.startsWith(year)).sort((a,b)=>b.date.localeCompare(a.date));
  if(mfRows.length) rightHtml += _yCard(`💹 Mutual Funds — <span class="yr-count">${mfRows.length}</span> — <span class="yr-card-inline-total">${fmt(mfRows.reduce((s,r)=>s+r.amount,0))}</span>`,
    _yTable([{l:'Date'},{l:'Fund'},{l:'Amount',amt:true},{l:'Status'}],
      mfRows.map(r=>[fmtD(r.date),r.name||'—',fmt(r.amount),r.status]),
      [{},{},{},{}], {statusCol:3}));

  // LIC
  const licRows = db.lic.filter(r=>r.date.startsWith(year)).sort((a,b)=>b.date.localeCompare(a.date));
  if(licRows.length) rightHtml += _yCard(`🛡️ LIC — <span class="yr-count">${licRows.length}</span> — <span class="yr-card-inline-total">${fmt(licRows.reduce((s,r)=>s+r.amount,0))}</span>`,
    _yTable([{l:'Date'},{l:'Policy'},{l:'Amount',amt:true},{l:'Status'}],
      licRows.map(r=>[fmtD(r.date),r.name||'—',fmt(r.amount),r.status]),
      [{},{},{},{}], {statusCol:3}));

  // Expenses
  const expRows = db.expenses.filter(r=>r.date.startsWith(year)).sort((a,b)=>b.date.localeCompare(a.date));
  if(expRows.length) rightHtml += _yCard(`🧾 Expenses — <span class="yr-count">${expRows.length}</span> — <span class="yr-card-inline-total r">${fmt(expRows.reduce((s,r)=>s+r.amount,0))}</span>`,
    _yTable([{l:'Date'},{l:'Name'},{l:'Category'},{l:'Amount',amt:true,r:true}],
      expRows.map(r=>[fmtD(r.date),r.name||'—',r.category||'—',fmt(r.amount)]),
      [{},{},{},{r:true}])
    + `<div class="yr-card-total r">Total: ${fmt(expRows.reduce((s,r)=>s+r.amount,0))}</div>`);

  // Loans
  const loanRows = db.loans.filter(r=>r.date.startsWith(year)).sort((a,b)=>b.date.localeCompare(a.date));
  if(loanRows.length) rightHtml += _yCard(`🏦 Loans — <span class="yr-count">${loanRows.length}</span> — <span class="yr-card-inline-total r">${fmt(loanRows.reduce((s,r)=>s+r.principal,0))}</span>`,
    _yTable([{l:'Date'},{l:'Loan'},{l:'Lender'},{l:'Principal',amt:true,r:true},{l:'Rate'}],
      loanRows.map(r=>[fmtD(r.date),r.name||'—',r.lender||'—',fmt(r.principal),r.rate?r.rate+'%':'—']),
      [{},{},{},{r:true},{}]));

  // Custom sections
  if(typeof loadCustomDefs==='function'){
    loadCustomDefs().forEach(def=>{
      const dc=def.columns.find(c=>c.type==='date');
      if(!dc) return;
      const rows=(db.custom[def.id]||[]).filter(r=>r[dc.key]?.startsWith(year)).sort((a,b)=>(b[dc.key]||'').localeCompare(a[dc.key]||''));
      if(!rows.length) return;
      const ac=def.columns.find(c=>c.type==='number');
      const total=ac?rows.reduce((s,r)=>s+(parseFloat(r[ac.key])||0),0):0;
      const isDed=def.sectionType==='deduction';
      const headers=def.columns.map(c=>({l:c.label}));
      const bodyRows=rows.map(r=>def.columns.map(c=>{
        const v=r[c.key]??'—';
        if(c.type==='date') return fmtD(v);
        if(c.type==='number') return fmt(parseFloat(v)||0);
        if(c.type==='rate') return v?v+'%':'—';
        if(c.type==='status') return v;
        return String(v).slice(0,22);
      }));
      const styles=def.columns.map(c=>({amt:c.type==='number',r:isDed&&c.type==='number',g:!isDed&&c.type==='number'}));
      const statusColIdx=def.columns.findIndex(c=>c.type==='status');
      rightHtml+=_yCard(
        `${def.icon} ${def.name} — <span class="yr-count">${rows.length}</span>${total?` — <span class="yr-card-inline-total ${isDed?'r':''}">${fmt(total)}</span>`:''}`,
        _yTable(headers,bodyRows,styles,statusColIdx>=0?{statusCol:statusColIdx}:{})
      );
    });
  }

  if(!rightHtml) rightHtml=`<div style="color:var(--muted);text-align:center;padding:60px;font-size:.85rem">No transactions in ${year}.</div>`;

  contentEl.innerHTML = `<div class="year-layout"><div class="year-left">${leftHtml}</div><div class="year-right">${rightHtml}</div></div>`;
}

// ── Yearly helper: build table ──
function _yTable(headers, rows, styles=[], opts={}){
  const thead = headers.map(h=>`<th>${h.l}</th>`).join('');
  const tbody = rows.map(r=>{
    const cells = r.map((v,i)=>{
      const s = styles[i]||{};
      if(opts.statusCol===i) return `<td>${statusBadge(v)}</td>`;
      const cls = s.g?'amt-g':s.r?'amt-r':s.gold?'interest-live':'';
      return `<td ${s.amt||cls?`class="${['amt',cls].filter(Boolean).join(' ')}"`:''} >${v}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${thead}</tr></thead><tbody>${tbody||'<tr class="empty-row"><td colspan="'+headers.length+'">—</td></tr>'}</tbody></table></div>`;
}

function _yCard(title, body){
  return `<div class="year-section-card"><h4>${title}</h4>${body}</div>`;
}

// ── WALLET LEDGER ──
function renderLedger(){
  const settings     = getWalletSettings();
  const startDate    = settings.startDate || '';
  const openingBal   = parseFloat(settings.openingBalance) || 0;
  function afterStart(d){ return !startDate || !d || d >= startDate; }

  // Build every wallet transaction from all data sources
  const txns = [];

  function push(date, type, flow, description, amount){
    if(!afterStart(date)) return;
    txns.push({ date: date||'', type, flow, description, amount: Math.round(amount) });
  }

  // Salary / Income — IN
  db.salary.forEach(r => push(r.date, 'Salary', 'in',
    `${r.type||'Salary'}${r.source?' — '+r.source:''}${r.month?' ('+r.month+')':''}`, r.amount));

  // Investment Returns — IN (when closed)
  ['ppf','fd','business','outside','stocks','mf','lic'].forEach(k=>{
    db[k].filter(r=>r.status!=='Active' && r.returnDate).forEach(r=>{
      const name = r.bank||r.name||r.person||r.fdNumber||k.toUpperCase();
      const total = (r.returnAmount||0)+(r.returnInterest||0);
      if(total > 0) push(r.returnDate, 'Investment Return', 'in',
        `${k.toUpperCase()} returned — ${name}${r.returnInterest?' (P:'+fmt(r.returnAmount||0)+' + I:'+fmt(r.returnInterest||0)+')':''}`, total);
    });
    // backward compat FD
    if(k==='fd'){
      db.fd.filter(r=>r.status!=='Active'&&r.brokenAmount>0&&!r.returnAmount&&r.brokenDate).forEach(r=>{
        push(r.brokenDate,'Investment Return','in',`FD returned — ${r.bank||r.fdNumber||''}`,r.brokenAmount);
      });
    }
  });

  // Investments made — OUT
  ['ppf','fd','business','outside','stocks','mf','lic'].forEach(k=>{
    const labels = {ppf:'PPF',fd:'FD',business:'Business',outside:'Outside Given',stocks:'Stocks',mf:'Mutual Fund',lic:'LIC'};
    db[k].forEach(r=>{
      const name = r.bank||r.name||r.person||r.fdNumber||'';
      push(r.date, 'Investment', 'out', `${labels[k]}${name?' — '+name:''}`, r.amount);
    });
  });

  // Expenses — OUT
  db.expenses.forEach(r => push(r.date, 'Expense', 'out',
    `${r.name||'Expense'}${r.category?' ('+r.category+')':''}`, r.amount));

  // Loan EMI payments — OUT
  db.loanPayments.forEach(p=>{
    const loan = db.loans.find(l=>l.id===p.loanId);
    push(p.date, 'Loan EMI', 'out', `EMI — ${loan?loan.name:'Loan'}`, p.amount);
  });

  // Custom sections
  if(typeof loadCustomDefs==='function'){
    loadCustomDefs().forEach(def=>{
      const dateCol = def.columns.find(c=>c.type==='date');
      const amtCol  = def.columns.find(c=>c.type==='number');
      const nameCol = def.columns.find(c=>c.type==='text');
      if(!dateCol||!amtCol) return;
      const flowType = def.sectionType==='deduction' ? 'Deduction' : 'Investment';
      (db.custom[def.id]||[]).forEach(r=>{
        const nm = nameCol ? r[nameCol.key] : '';
        push(r[dateCol.key], flowType, 'out',
          `${def.icon} ${def.name}${nm?' — '+nm:''}`, parseFloat(r[amtCol.key])||0);
      });
    });
  }

  // Sort by date ascending (oldest first) for running balance
  txns.sort((a,b)=> a.date.localeCompare(b.date) || 0);

  // Compute running balance
  let running = openingBal;
  const withBalance = txns.map((t,i)=>{
    running += t.flow==='in' ? t.amount : -t.amount;
    return { ...t, running, sno: i+1 };
  });

  // ── KPI ──
  const totalIn  = txns.filter(t=>t.flow==='in').reduce((s,t)=>s+t.amount,0);
  const totalOut = txns.filter(t=>t.flow==='out').reduce((s,t)=>s+t.amount,0);
  const balance  = openingBal + totalIn - totalOut;
  document.getElementById('kpi-ledger').innerHTML =
    skpi('Total Transactions', txns.length, 'b') +
    skpi('Total IN', fmt(totalIn), 'g') +
    skpi('Total OUT', fmt(totalOut), 'r') +
    skpi('Current Balance', fmt(balance), balance>=0?'g':'r');

  // ── Filters ──
  const flowF   = document.getElementById('fil-ledger-flow')?.value  || 'all';
  const typeF   = document.getElementById('fil-ledger-type')?.value  || 'all';
  const monthF  = document.getElementById('fil-ledger-month')?.value || '';
  const searchF = (document.getElementById('fil-ledger-search')?.value||'').toLowerCase();

  let filtered = [...withBalance].reverse(); // newest first for display
  if(flowF  !== 'all') filtered = filtered.filter(t=>t.flow===flowF);
  if(typeF  !== 'all') filtered = filtered.filter(t=>t.type===typeF);
  if(monthF)           filtered = filtered.filter(t=>t.date.startsWith(monthF));
  if(searchF)          filtered = filtered.filter(t=>
    t.description.toLowerCase().includes(searchF)||t.type.toLowerCase().includes(searchF));

  // ── Table ──
  const tbody = document.querySelector('#tbl-ledger tbody');
  if(!filtered.length){
    tbody.innerHTML=`<tr class="empty-row"><td colspan="7">No transactions found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(t=>`<tr class="${t.flow==='in'?'ledger-row-in':'ledger-row-out'}">
    <td style="color:var(--dim);font-size:.7rem">${t.sno}</td>
    <td>${fmtD(t.date)}</td>
    <td><span class="ledger-type-badge ledger-${t.type.toLowerCase().replace(/\s+/g,'-')}">${t.type}</span></td>
    <td><span class="badge badge-${t.flow}">${t.flow.toUpperCase()}</span></td>
    <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${t.description}">${t.description}</td>
    <td class="amt ${t.flow==='in'?'amt-g':'amt-r'}">${t.flow==='in'?'+':'-'}${fmt(t.amount)}</td>
    <td class="amt ${t.running>=0?'amt-g':'amt-r'}" style="font-weight:700">${fmt(t.running)}</td>
  </tr>`).join('');
}
const RENDER_MAP={
  ppf:renderPPF,fd:renderFD,business:renderBusiness,outside:renderOutside,
  stocks:renderStocks,mf:renderMF,lic:renderLIC,expenses:renderExpenses,
  salary:renderSalary,loans:renderLoans,wallet:renderWallet,
  ledger:renderLedger,yearly:renderYearly
};
function renderSection(s){
  if(s && s.startsWith('custom-')){ renderCustomSection(s.replace('custom-','')); return; }
  const fn=RENDER_MAP[s]; if(fn) fn();
}

// ── DASHBOARD ──
function renderDashboard(){
  const wallet=calcWalletBalance();
  const returns=totalReturns();
  document.getElementById('kpi-invested').textContent=fmt(totalInvested());
  document.getElementById('kpi-income').textContent=fmt(thisYearIncome());
  const builtInInterest = totalInterestEarned();
  const customInterest  = typeof customSectionsTotalInterest==='function' ? customSectionsTotalInterest() : 0;
  document.getElementById('kpi-interest').textContent=fmt(builtInInterest + customInterest);
  document.getElementById('kpi-expense').textContent=fmt(thisYearExpenses());
  document.getElementById('kpi-returns').textContent=fmt(returns.total);
  document.getElementById('kpi-returns-sub').textContent=
    returns.total > 0 ? `P: ${fmt(returns.principal)}  +  I: ${fmt(returns.interest)}` : 'No closed investments yet';
  document.getElementById('kpi-wallet-dash').textContent=fmt(wallet.balance);
  document.getElementById('kpi-loan-dash').textContent=fmt(totalLoanOutstanding());

  // Summary table
  const rows=[
    {label:'PPF',key:'ppf',hasInt:false},{label:'Fixed Deposits',key:'fd',hasInt:true},
    {label:'Business',key:'business',hasInt:true},{label:'Outside Given',key:'outside',hasInt:true},
    {label:'Stocks',key:'stocks',hasInt:false},{label:'Mutual Funds',key:'mf',hasInt:false},{label:'LIC',key:'lic',hasInt:false}
  ];
  let summaryHtml = rows.map(r=>{
    const active=db[r.key].filter(x=>x.status==='Active');
    const inv=active.reduce((s,x)=>s+x.amount,0);
    const interest=r.hasInt?active.reduce((s,x)=>s+calcInterest(x.amount,x.rate,x.date),0):null;
    return `<tr>
      <td>${r.label}</td><td>${active.length}</td>
      <td class="amt">${fmt(inv)}</td>
      <td class="interest-live">${interest!==null?fmt(interest):'—'}</td>
    </tr>`;
  }).join('');
  if(typeof customSectionsSummaryRows==='function'){
    customSectionsSummaryRows().forEach(r=>{
      const style = r.isDeduction ? 'style="color:var(--red)"' : '';
      const prefix = r.isDeduction ? '-' : '';
      const interestCell = r.interest!=null
        ? `<td class="interest-live">${fmt(r.interest)}</td>`
        : `<td>—</td>`;
      summaryHtml+=`<tr ${style}><td>${r.label}${r.isDeduction?' ⬇️':''}</td><td>${r.count}</td><td class="amt" ${style}>${prefix}${fmt(r.amount)}</td>${interestCell}</tr>`;
    });
  }
  // Loans row
  const activeLoanAmt=db.loans.filter(l=>l.status==='Active').reduce((s,l)=>s+loanOutstanding(l),0);
  if(activeLoanAmt>0){
    summaryHtml+=`<tr style="color:var(--red)"><td>🏦 Loans (Outstanding)</td><td>${db.loans.filter(l=>l.status==='Active').length}</td><td class="amt" style="color:var(--red)">-${fmt(activeLoanAmt)}</td><td>—</td></tr>`;
  }
  document.querySelector('#tbl-summary tbody').innerHTML=summaryHtml;

  // Recent activity
  const allRecent=[];
  [{k:'ppf',l:'PPF'},{k:'fd',l:'FD'},{k:'business',l:'Business'},{k:'outside',l:'Outside Given'},
   {k:'stocks',l:'Stocks'},{k:'mf',l:'Mutual Fund'},{k:'lic',l:'LIC'},
   {k:'expenses',l:'Expense'},{k:'salary',l:'Income'}].forEach(({k,l})=>{
    db[k].forEach(r=>allRecent.push({date:r.date,section:l,name:r.name||r.bank||r.person||r.fdNumber||r.type||'',amount:r.amount,flow:k==='salary'?'in':k==='expenses'?'out':'invest'}));
  });
  db.loans.forEach(r=>allRecent.push({date:r.date,section:'Loan Taken',name:r.name,amount:r.principal,flow:'out'}));
  db.loanPayments.forEach(p=>{
    const l=db.loans.find(x=>x.id===p.loanId);
    allRecent.push({date:p.date,section:'Loan EMI',name:l?l.name:'',amount:p.amount,flow:'out'});
  });
  if(typeof loadCustomDefs==='function'){
    loadCustomDefs().forEach(def=>{
      const amtCol=def.columns.find(c=>c.type==='number');
      const nameCol=def.columns.find(c=>c.type==='text');
      const dateCol=def.columns.find(c=>c.type==='date');
      (db.custom[def.id]||[]).forEach(r=>{
        allRecent.push({date:dateCol?r[dateCol.key]:'',section:def.name,name:nameCol?r[nameCol.key]:'',amount:amtCol?(parseFloat(r[amtCol.key])||0):0,flow:'invest'});
      });
    });
  }
  allRecent.sort((a,b)=>b.date.localeCompare(a.date));
  document.querySelector('#tbl-recent tbody').innerHTML=allRecent.slice(0,10).map(r=>`<tr>
    <td>${fmtD(r.date)}</td><td>${r.section}</td><td>${r.name||'—'}</td>
    <td class="amt ${r.flow==='in'?'amt-g':r.flow==='out'?'amt-r':''}">${r.flow==='in'?'+':r.flow==='out'?'-':''}${fmt(r.amount)}</td>
  </tr>`).join('')||'<tr class="empty-row"><td colspan="4">No entries yet</td></tr>';
  renderCharts();
}
