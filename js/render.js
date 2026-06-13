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
  // Collect all years from all data
  const allDates=[];
  ['ppf','fd','business','outside','stocks','mf','lic'].forEach(k=>db[k].forEach(r=>r.date&&allDates.push(r.date)));
  db.expenses.forEach(r=>r.date&&allDates.push(r.date));
  db.salary.forEach(r=>r.date&&allDates.push(r.date));
  db.loans.forEach(r=>r.date&&allDates.push(r.date));
  if(typeof loadCustomDefs==='function') loadCustomDefs().forEach(def=>{
    const dc=def.columns.find(c=>c.type==='date');
    (db.custom[def.id]||[]).forEach(r=>dc&&r[dc.key]&&allDates.push(r[dc.key]));
  });
  const years=[...new Set(allDates.map(d=>d.slice(0,4)).filter(y=>y.match(/^\d{4}$/)))].sort().reverse();
  if(!years.length){ document.getElementById('year-tabs').innerHTML='<p style="color:var(--muted);font-size:.82rem">No data yet.</p>'; return; }

  const year = selectedYear || years[0];

  // Render year tabs
  document.getElementById('year-tabs').innerHTML = years.map(y=>
    `<button class="year-tab ${y===year?'active':''}" onclick="renderYearly('${y}')">${y}</button>`
  ).join('');

  // Year KPIs
  const ySalary = db.salary.filter(r=>r.date.startsWith(year)).reduce((s,r)=>s+r.amount,0);
  const yExp    = db.expenses.filter(r=>r.date.startsWith(year)).reduce((s,r)=>s+r.amount,0);
  const yInvested = ['ppf','fd','business','outside','stocks','mf','lic']
    .reduce((s,k)=>s+db[k].filter(r=>r.date.startsWith(year)).reduce((a,r)=>a+r.amount,0),0);
  const yReturns = ['ppf','fd','business','outside','stocks','mf','lic']
    .reduce((s,k)=>s+db[k].filter(r=>r.returnDate?.startsWith(year)).reduce((a,r)=>a+(r.returnAmount||0)+(r.returnInterest||0),0),0);

  document.getElementById('year-kpi-row').innerHTML=`
    <div class="kpi blue"><div class="kpi-l">Income ${year}</div><div class="kpi-v" style="color:var(--green)">${fmt(ySalary)}</div></div>
    <div class="kpi red"><div class="kpi-l">Expenses ${year}</div><div class="kpi-v" style="color:var(--red)">${fmt(yExp)}</div></div>
    <div class="kpi gold"><div class="kpi-l">Net ${year}</div><div class="kpi-v" style="color:${ySalary-yExp>=0?'var(--green)':'var(--red)'}">${fmt(ySalary-yExp)}</div></div>`;

  // Section summaries
  const sections=[
    {label:'💰 Salary / Income', rows: db.salary.filter(r=>r.date.startsWith(year)),
     cols:['date','month','type','amount','source'],
     amtKey:'amount', flow:'in'},
    {label:'🏧 Fixed Deposits', rows: db.fd.filter(r=>r.date.startsWith(year)),
     cols:['date','fdNumber','bank','amount','rate','status'],
     amtKey:'amount', flow:'out'},
    {label:'🏦 PPF', rows: db.ppf.filter(r=>r.date.startsWith(year)),
     cols:['date','bank','amount','status'], amtKey:'amount', flow:'out'},
    {label:'💼 Business', rows: db.business.filter(r=>r.date.startsWith(year)),
     cols:['date','name','amount','rate','status'], amtKey:'amount', flow:'out'},
    {label:'🤝 Outside Given', rows: db.outside.filter(r=>r.date.startsWith(year)),
     cols:['date','person','amount','rate','status'], amtKey:'amount', flow:'out'},
    {label:'📈 Stocks', rows: db.stocks.filter(r=>r.date.startsWith(year)),
     cols:['date','name','amount','status'], amtKey:'amount', flow:'out'},
    {label:'💹 Mutual Funds', rows: db.mf.filter(r=>r.date.startsWith(year)),
     cols:['date','name','amount','status'], amtKey:'amount', flow:'out'},
    {label:'🛡️ LIC', rows: db.lic.filter(r=>r.date.startsWith(year)),
     cols:['date','name','amount','status'], amtKey:'amount', flow:'out'},
    {label:'🧾 Expenses', rows: db.expenses.filter(r=>r.date.startsWith(year)),
     cols:['date','name','category','amount'], amtKey:'amount', flow:'out'},
    {label:'🏦 Loans Taken', rows: db.loans.filter(r=>r.date.startsWith(year)),
     cols:['date','name','lender','principal','rate'], amtKey:'principal', flow:'out'},
  ];

  // Also closed investments this year
  const closedThisYear=[];
  ['ppf','fd','business','outside','stocks','mf','lic'].forEach(k=>{
    db[k].filter(r=>r.returnDate?.startsWith(year)&&r.status!=='Active').forEach(r=>{
      closedThisYear.push({date:r.returnDate,name:r.bank||r.name||r.person||r.fdNumber,principal:r.returnAmount||0,interest:r.returnInterest||0,total:(r.returnAmount||0)+(r.returnInterest||0)});
    });
  });

  let html='';

  // Closed investments returns this year
  if(closedThisYear.length){
    html+=`<div class="year-section-card">
      <h4>✅ Investment Returns Received in ${year}</h4>
      <table class="tbl"><thead><tr><th>Date</th><th>Name</th><th>Principal</th><th>Interest</th><th>Total Received</th></tr></thead>
      <tbody>${closedThisYear.map(r=>`<tr>
        <td>${fmtD(r.date)}</td><td>${r.name||'—'}</td>
        <td class="amt">${fmt(r.principal)}</td>
        <td class="interest-live">${fmt(r.interest)}</td>
        <td class="amt amt-g">+${fmt(r.total)}</td>
      </tr>`).join('')}</tbody></table>
      <div style="text-align:right;margin-top:8px;font-size:.8rem;color:var(--green);font-weight:700">
        Total returned: ${fmt(closedThisYear.reduce((s,r)=>s+r.total,0))}
      </div>
    </div>`;
  }

  // Custom sections
  if(typeof loadCustomDefs==='function'){
    loadCustomDefs().forEach(def=>{
      const dateCol=def.columns.find(c=>c.type==='date');
      if(!dateCol) return;
      const rows=(db.custom[def.id]||[]).filter(r=>r[dateCol.key]?.startsWith(year));
      if(!rows.length) return;
      sections.push({label:def.icon+' '+def.name, rows, cols:def.columns.map(c=>c.key), amtKey:def.columns.find(c=>c.type==='number')?.key, flow:def.sectionType==='deduction'?'out':'out'});
    });
  }

  sections.forEach(sec=>{
    if(!sec.rows.length) return;
    const total = sec.amtKey ? sec.rows.reduce((s,r)=>s+(parseFloat(r[sec.amtKey])||0),0) : 0;
    const colHeaders = sec.cols.map(c=>`<th>${c}</th>`).join('');
    const bodyRows = sec.rows.sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(r=>{
      const cells = sec.cols.map(c=>{
        const v=r[c]??'—';
        if(c==='date') return `<td>${fmtD(v)}</td>`;
        if(c===sec.amtKey) return `<td class="amt ${sec.flow==='in'?'amt-g':''}">${fmt(parseFloat(v)||0)}</td>`;
        if(c==='status') return `<td>${statusBadge(v)}</td>`;
        return `<td>${String(v).slice(0,20)}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    html+=`<div class="year-section-card">
      <h4>${sec.label} — ${sec.rows.length} entr${sec.rows.length===1?'y':'ies'}
        ${total?`<span style="margin-left:8px;color:${sec.flow==='in'?'var(--green)':'var(--muted)'};font-size:.75rem">${fmt(total)}</span>`:''}
      </h4>
      <div style="overflow-x:auto">
        <table class="tbl"><thead><tr>${colHeaders}</tr></thead><tbody>${bodyRows}</tbody></table>
      </div>
    </div>`;
  });

  document.getElementById('year-content').innerHTML = html || `<p style="color:var(--muted);text-align:center;padding:32px">No transactions found for ${year}.</p>`;
}

// ── MASTER RENDER ──
const RENDER_MAP={
  ppf:renderPPF,fd:renderFD,business:renderBusiness,outside:renderOutside,
  stocks:renderStocks,mf:renderMF,lic:renderLIC,expenses:renderExpenses,
  salary:renderSalary,loans:renderLoans,wallet:renderWallet,yearly:renderYearly
};
function renderSection(s){
  if(s && s.startsWith('custom-')){ renderCustomSection(s.replace('custom-','')); return; }
  const fn=RENDER_MAP[s]; if(fn) fn();
}

// ── DASHBOARD ──
function renderDashboard(){
  const wallet=calcWalletBalance();
  document.getElementById('kpi-invested').textContent=fmt(totalInvested());
  document.getElementById('kpi-income').textContent=fmt(thisYearIncome());
  const builtInInterest = totalInterestEarned();
  const customInterest  = typeof customSectionsTotalInterest==='function' ? customSectionsTotalInterest() : 0;
  document.getElementById('kpi-interest').textContent=fmt(builtInInterest + customInterest);
  document.getElementById('kpi-expense').textContent=fmt(thisYearExpenses());
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
