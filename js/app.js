// ── APP ──
let currentPage = 'dashboard';

const PAGE_TITLES={
  dashboard:'Dashboard', ppf:'PPF Accounts', fd:'Fixed Deposits',
  business:'Business Investments', outside:'Outside Given Amounts',
  stocks:'Stocks', mf:'Mutual Funds', lic:'LIC Policies',
  expenses:'Monthly Expenses', salary:'Salary & Income',
  loans:'Loans Taken', loanPayments:'Loan EMI Payments', wallet:'👛 Wallet & Cash Flow'
};

function nav(page){
  currentPage=page;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
  const pg=document.getElementById('page-'+page);
  if(pg) pg.classList.add('active');
  const nb=document.querySelector(`[data-page="${page}"]`);
  if(nb) nb.classList.add('active');
  document.getElementById('topbar-title').textContent=PAGE_TITLES[page]||page;
  const addBtn=document.querySelector('.topbar-actions');
  addBtn.style.display=(page==='dashboard'||page==='wallet')?'none':'flex';
  if(page!=='dashboard') renderSection(page);
  else renderDashboard();
}

function showToast(msg, isErr=false){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.style.borderColor=isErr?'var(--red)':'var(--green)';
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}

function bootApp(wb){
  document.getElementById('modal-config').style.display='none';
  document.getElementById('app').style.display='flex';
  // wrap pages in scrollable div
  const main=document.querySelector('.main-area');
  const existing=main.querySelector('.pages-wrap');
  if(!existing){
    const wrap=document.createElement('div');
    wrap.className='pages-wrap';
    const pages=[...main.querySelectorAll('.page')];
    pages.forEach(p=>wrap.appendChild(p));
    main.appendChild(wrap);
  }
  // Boot custom sections
  bootCustomSections(wb || XLSX.utils.book_new());
  nav('dashboard');
}

// Fix delete modal confirm button for regular vs custom deletes
document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('btn-confirm-del').onclick = confirmDelete;

  const cfg=ghLoadConfig();
  if(cfg){ ghLoad(); }
  else { document.getElementById('modal-config').style.display='flex'; }
});
