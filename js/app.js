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
  currentPage = page;

  // Show/hide pages-wrap vs yearly
  const wrap   = document.querySelector('.pages-wrap');
  const yearly = document.getElementById('page-yearly');

  // Hide all .page elements
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  if(page === 'yearly'){
    // yearly is not a .page — show it directly, scroll to top
    if(yearly){ yearly.style.display = 'flex'; }
    if(wrap) wrap.scrollTop = 0;
  } else {
    if(yearly) yearly.style.display = 'none';
    const pg = document.getElementById('page-' + page);
    if(pg) pg.classList.add('active');
  }

  document.querySelectorAll('.nav-item').forEach(b  => b.classList.remove('active'));
  document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  document.querySelector(`[data-bpage="${page}"]`)?.classList.add('active');
  expandGroupForPage(page);

  document.getElementById('topbar-title').textContent = PAGE_TITLES[page] || page;
  document.querySelector('.topbar-actions').style.display =
    (page==='dashboard'||page==='wallet'||page==='yearly') ? 'none' : 'flex';

  if(page === 'wallet') loadWalletSettingsUI();
  if(page !== 'dashboard') renderSection(page);
  else renderDashboard();
}

// ── COLLAPSIBLE NAV GROUPS ──
function toggleNavGroup(headerBtn){
  const group = headerBtn.closest('.nav-group');
  group.classList.toggle('open');
  // Save state to localStorage
  const groupId = group.id || group.querySelector('.nav-group-header span')?.textContent;
  if(groupId){
    const states = JSON.parse(localStorage.getItem('nf_nav_states')||'{}');
    states[groupId] = group.classList.contains('open');
    localStorage.setItem('nf_nav_states', JSON.stringify(states));
  }
}

function restoreNavStates(){
  const states = JSON.parse(localStorage.getItem('nf_nav_states')||'{}');
  document.querySelectorAll('.nav-group').forEach(group=>{
    const key = group.id || group.querySelector('.nav-group-header span')?.textContent;
    if(key && states[key] !== undefined){
      group.classList.toggle('open', states[key]);
    }
  });
}

// Auto-expand the group containing the navigated-to page
function expandGroupForPage(page){
  const btn = document.querySelector(`[data-page="${page}"]`);
  if(!btn) return;
  const group = btn.closest('.nav-group');
  if(group && !group.classList.contains('open')){
    group.classList.add('open');
  }
}
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
  const main = document.querySelector('.main-area');

  if(!main.querySelector('.pages-wrap')){
    const wrap = document.createElement('div');
    wrap.className = 'pages-wrap';
    // Move ALL .page elements AND yearly into pages-wrap
    [...main.querySelectorAll('.page')].forEach(p => wrap.appendChild(p));
    const yearly = document.getElementById('page-yearly');
    if(yearly) wrap.appendChild(yearly);
    main.appendChild(wrap);
  }

  bootCustomSections(wb||XLSX.utils.book_new());
  restoreNavStates();
  nav('dashboard');
}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('btn-confirm-del').onclick=confirmDelete;
  const cfg=ghLoadConfig();
  if(cfg){ ghLoad(); }
  else { document.getElementById('modal-config').style.display='flex'; }
});
