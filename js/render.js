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
    <td>${r.source||'—'}</td><td title="${r.details||''}">${(r.details||'—').slice(0,40)}${r.details?.length>40?'…':''}</td>
    <td>${actBtns('ppf',r.id,r.status)}</td>
  </tr>`).join(''):empty(7);
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
    const interest=calcInterest(r.amount,r.rate,r.date);
    const reinvest=r.reinvestedInto?`<span class="reinvest-tag">→ ${r.reinvestedInto}</span> ${r.reinvestNote||''}`:r.status!=='Active'?'Withdrawn':'—';
    return `<tr>
      <td>${fmtD(r.date)}</td><td>${r.fdNumber||'—'}</td><td>${r.bank||'—'}</td>
      <td class="amt">${fmt(r.amount)}</td><td>${fmtRate(r.rate)}</td>
      <td class="interest-live">${r.status==='Active'?fmt(interest):'—'}</td>
      <td>${statusBadge(r.status)}</td>
      <td style="font-size:.72rem">${reinvest}</td>
      <td>${r.source||'—'}</td>
      <td title="${r.details||''}">${(r.details||'—').slice(0,30)}${r.details?.length>30?'…':''}</td>
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
    skpi('Active',active.length,'b')+skpi('Total Invested',fmt(totalInv),'g')+skpi('Returns Earned',fmt(totalInt),'gold');
  const tbody=document.querySelector('#tbl-business tbody');
  tbody.innerHTML=rows.length?rows.map(r=>{
    const interest=calcInterest(r.amount,r.rate,r.date);
    return `<tr>
      <td>${fmtD(r.date)}</td><td>${r.name||'—'}</td>
      <td class="amt">${fmt(r.amount)}</td><td>${fmtRate(r.rate)}</td>
      <td class="interest-live">${r.status==='Active'?fmt(interest):'—'}</td>
      <td>${statusBadge(r.status)}</td><td>${r.source||'—'}</td>
      <td title="${r.details||''}">${(r.details||'—').slice(0,30)}${r.details?.length>30?'…':''}</td>
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
    skpi('Active Loans',active.length,'b')+skpi('Total Given',fmt(totalGiven),'g')+skpi('Interest Earned',fmt(totalInt),'gold');
  const tbody=document.querySelector('#tbl-outside tbody');
  tbody.innerHTML=rows.length?rows.map(r=>{
    const interest=calcInterest(r.amount,r.rate,r.date);
    return `<tr>
      <td>${fmtD(r.date)}</td><td>${r.person||'—'}</td>
      <td class="amt">${fmt(r.amount)}</td><td>${fmtRate(r.rate)}</td>
      <td class="interest-live">${r.status==='Active'?fmt(interest):'—'}</td>
      <td>${statusBadge(r.status)}</td><td>${r.source||'—'}</td>
      <td title="${r.details||''}">${(r.details||'—').slice(0,30)}${r.details?.length>30?'…':''}</td>
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

// ── MASTER RENDER ──
const RENDER_MAP={ppf:renderPPF,fd:renderFD,business:renderBusiness,outside:renderOutside,stocks:renderStocks,mf:renderMF,lic:renderLIC,expenses:renderExpenses,salary:renderSalary};
function renderSection(s){
  if(s && s.startsWith('custom-')){ renderCustomSection(s.replace('custom-','')); return; }
  const fn=RENDER_MAP[s]; if(fn) fn();
}

// ── DASHBOARD ──
function renderDashboard(){
  document.getElementById('kpi-invested').textContent=fmt(totalInvested());
  document.getElementById('kpi-income').textContent=fmt(thisYearIncome());
  document.getElementById('kpi-interest').textContent=fmt(totalInterestEarned());
  document.getElementById('kpi-expense').textContent=fmt(thisYearExpenses());
  // Summary table — built-in sections
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
  // Custom sections in summary
  if(typeof customSectionsSummaryRows === 'function'){
    customSectionsSummaryRows().forEach(r => {
      summaryHtml += `<tr>
        <td>${r.label}</td><td>${r.count}</td>
        <td class="amt">${fmt(r.amount)}</td><td>—</td>
      </tr>`;
    });
  }
  document.querySelector('#tbl-summary tbody').innerHTML = summaryHtml;
  // Recent — built-in + custom
  const allRecent=[];
  [{k:'ppf',l:'PPF'},{k:'fd',l:'FD'},{k:'business',l:'Business'},{k:'outside',l:'Outside Given'},
   {k:'stocks',l:'Stocks'},{k:'mf',l:'Mutual Fund'},{k:'lic',l:'LIC'},
   {k:'expenses',l:'Expense'},{k:'salary',l:'Income'}].forEach(({k,l})=>{
    db[k].forEach(r=>allRecent.push({date:r.date,section:l,name:r.name||r.bank||r.person||r.fdNumber||r.type||'',amount:r.amount,flow:k==='salary'?'in':k==='expenses'?'out':'invest'}));
  });
  // Add custom section recent entries
  if(typeof loadCustomDefs === 'function'){
    loadCustomDefs().forEach(def => {
      const amtCol = def.columns.find(c=>c.type==='number');
      const nameCol = def.columns.find(c=>c.type==='text');
      const dateCol = def.columns.find(c=>c.type==='date');
      (db.custom[def.id]||[]).forEach(r => {
        allRecent.push({
          date: dateCol ? r[dateCol.key] : '',
          section: def.name,
          name: nameCol ? r[nameCol.key] : '',
          amount: amtCol ? (parseFloat(r[amtCol.key])||0) : 0,
          flow: 'invest'
        });
      });
    });
  }
  allRecent.sort((a,b)=>b.date.localeCompare(a.date));
  document.querySelector('#tbl-recent tbody').innerHTML=allRecent.slice(0,10).map(r=>`<tr>
    <td>${fmtD(r.date)}</td><td>${r.section}</td><td>${r.name||'—'}</td>
    <td class="amt ${r.flow==='in'?'amt-g':''}">${r.flow==='in'?'+':r.flow==='out'?'-':''}${fmt(r.amount)}</td>
  </tr>`).join('')||'<tr class="empty-row"><td colspan="4">No entries yet</td></tr>';
  renderCharts();
}
