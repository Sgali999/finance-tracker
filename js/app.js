// ── APP ──
let currentPage = 'dashboard';

const PAGE_TITLES={
  dashboard:'Dashboard', ppf:'PPF Accounts', fd:'Fixed Deposits',
  business:'Business Investments', outside:'Outside Given Amounts',
  stocks:'Stocks', mf:'Mutual Funds', lic:'LIC Policies',
  expenses:'Monthly Expenses', salary:'Salary & Income',
  loans:'Loans Taken', wallet:'👛 Wallet & Cash Flow', yearly:'📅 Yearly Report'
};

function nav(page){
  currentPage=page;
  document.querySelectorAll('.page').forEach(p=>{
    p.classList.remove('active');
    p.style.display='none';
  });
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.bnav-item').forEach(b=>b.classList.remove('active'));

  const pg=document.getElementById('page-'+page);
  if(pg){
    pg.classList.add('active');
    pg.style.display='block';
  }
  const nb=document.querySelector(`[data-page="${page}"]`);
  if(nb) nb.classList.add('active');
  const bnb=document.querySelector(`[data-bpage="${page}"]`);
  if(bnb) bnb.classList.add('active');

  document.getElementById('topbar-title').textContent=PAGE_TITLES[page]||page;
  const addBtn=document.querySelector('.topbar-actions');
  addBtn.style.display=(page==='dashboard'||page==='wallet'||page==='yearly')?'none':'flex';

  if(page==='wallet') loadWalletSettingsUI();
  if(page!=='dashboard') renderSection(page);
  else renderDashboard();
}

// ── MOBILE SIDEBAR ──
function toggleSidebar(){
  const sb=document.getElementById('app')?.querySelector('.sidebar')||document.querySelector('.sidebar');
  const ov=document.getElementById('sidebar-overlay');
  sb?.classList.toggle('open');
  ov?.classList.toggle('show');
}
function closeSidebarMobile(){
  const sb=document.querySelector('.sidebar');
  const ov=document.getElementById('sidebar-overlay');
  sb?.classList.remove('open');
  ov?.classList.remove('show');
}

function showToast(msg,isErr=false){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.style.borderColor=isErr?'var(--red)':'var(--green)';
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}

// ── WALLET SETTINGS UI ──
function loadWalletSettingsUI(){
  const s=getWalletSettings();
  const sd=document.getElementById('wallet-start-date');
  const ob=document.getElementById('wallet-opening-bal');
  if(sd) sd.value=s.startDate||'';
  if(ob) ob.value=s.openingBalance||'';
}
function saveWalletSettingsUI(){
  const sd=document.getElementById('wallet-start-date')?.value||'';
  const ob=parseFloat(document.getElementById('wallet-opening-bal')?.value)||0;
  saveWalletSettings({startDate:sd, openingBalance:ob});
  renderWallet();
  renderDashboard();
  showToast('✓ Wallet settings saved');
}

function bootApp(wb){
  document.getElementById('modal-config').style.display='none';
  document.getElementById('app').style.display='flex';
  const main=document.querySelector('.main-area');
  const existing=main.querySelector('.pages-wrap');
  if(!existing){
    const wrap=document.createElement('div');
    wrap.className='pages-wrap';
    [...main.querySelectorAll('.page')].forEach(p=>wrap.appendChild(p));
    main.appendChild(wrap);
  }
  bootCustomSections(wb||XLSX.utils.book_new());
  nav('dashboard');
}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('btn-confirm-del').onclick=confirmDelete;
  const cfg=ghLoadConfig();
  if(cfg){ ghLoad(); }
  else { document.getElementById('modal-config').style.display='flex'; }
});
