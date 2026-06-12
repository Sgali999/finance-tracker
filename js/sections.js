// ── CUSTOM SECTIONS ENGINE ──
// Stored in localStorage under 'nf_custom_sections' as JSON array
// Each section: { id, name, icon, sheetName, columns: [{key, label, type, showInSummary, isAmount}] }
// Data stored in db.custom[section.id] = []
// Also persisted as a dedicated sheet in the Excel workbook

const COLUMN_TYPES = [
  { value: 'text',     label: 'Text' },
  { value: 'number',   label: 'Number (₹ Amount)' },
  { value: 'date',     label: 'Date' },
  { value: 'rate',     label: 'Rate (% per year)' },
  { value: 'status',   label: 'Status (Active/Closed)' },
  { value: 'select',   label: 'Dropdown (custom options)' },
];

const SECTION_ICONS = ['📁','🏛️','🚗','🌾','🏠','💎','🎓','⚡','🩺','🛒','📦','🔧','🌐','🏆','💡'];

// ── Load / Save section definitions ──
function loadCustomDefs(){
  try { return JSON.parse(localStorage.getItem('nf_custom_sections') || '[]'); }
  catch(e){ return []; }
}
function saveCustomDefs(defs){
  localStorage.setItem('nf_custom_sections', JSON.stringify(defs));
}
function getCustomDefs(){ return loadCustomDefs(); }

// ── Ensure db.custom exists ──
function ensureCustomDb(){
  if(!db.custom) db.custom = {};
}

// ── Load custom sheet data from workbook ──
function loadCustomSheetsFromWb(wb){
  ensureCustomDb();
  const defs = loadCustomDefs();
  defs.forEach(def => {
    const sheetName = def.sheetName || def.name;
    if(wb.SheetNames.includes(sheetName)){
      db.custom[def.id] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {defval:''})
        .map(r => ({ id: r.id || uid(), ...r }));
    } else {
      db.custom[def.id] = db.custom[def.id] || [];
    }
  });
}

// ── Write custom sheets to workbook ──
function writeCustomSheetsToWb(wb){
  ensureCustomDb();
  const defs = loadCustomDefs();
  defs.forEach(def => {
    const data = db.custom[def.id] || [];
    const sheetName = def.sheetName || def.name;
    // Remove sheet if exists
    const idx = wb.SheetNames.indexOf(sheetName);
    if(idx > -1){ wb.SheetNames.splice(idx,1); delete wb.Sheets[sheetName]; }
    if(data.length){
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), sheetName);
    } else {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[]]), sheetName);
    }
  });
}

// ── BUILD a custom section into the DOM ──
function buildCustomSectionDOM(def){
  const pageId = 'page-custom-' + def.id;
  if(document.getElementById(pageId)) return; // already built

  // Build table headers
  const ths = def.columns.map(c => `<th>${c.label}</th>`).join('') + '<th>Actions</th>';

  // Build page HTML
  const page = document.createElement('div');
  page.className = 'page';
  page.id = pageId;
  page.innerHTML = `
    <div class="section-kpi-row" id="kpi-custom-${def.id}"></div>
    <div class="filter-bar">
      <input type="text" id="fil-custom-${def.id}-search" placeholder="Search…" oninput="renderCustomSection('${def.id}')" style="width:200px"/>
      ${def.columns.some(c=>c.type==='status') ? `<select id="fil-custom-${def.id}-status" onchange="renderCustomSection('${def.id}')">
        <option value="all">All Status</option><option value="Active">Active</option><option value="Closed">Closed</option>
      </select>` : ''}
    </div>
    <div class="card">
      <table class="tbl" id="tbl-custom-${def.id}">
        <thead><tr>${ths}</tr></thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  // Append to pages-wrap
  const wrap = document.querySelector('.pages-wrap') || document.querySelector('.main-area');
  wrap.appendChild(page);

  // Add nav item
  addCustomNavItem(def);
}

function addCustomNavItem(def){
  const navId = 'nav-custom-' + def.id;
  if(document.getElementById(navId)) return;
  const nav = document.querySelector('nav');
  // Find or create custom nav section header
  let header = document.getElementById('nav-section-custom');
  if(!header){
    header = document.createElement('div');
    header.className = 'nav-section';
    header.id = 'nav-section-custom';
    header.textContent = 'Custom';
    nav.appendChild(header);
  }
  const btn = document.createElement('button');
  btn.className = 'nav-item';
  btn.id = navId;
  btn.dataset.page = 'custom-' + def.id;
  btn.innerHTML = `<span class="nav-icon">${def.icon||'📁'}</span> ${def.name}
    <button class="nav-section-del" onclick="event.stopPropagation();confirmDeleteSection('${def.id}')" title="Delete section">✕</button>`;
  btn.onclick = () => nav_custom(def.id);
  nav.appendChild(btn);
}

// ── RENDER a custom section ──
function renderCustomSection(defId){
  ensureCustomDb();
  const def = loadCustomDefs().find(d => d.id === defId);
  if(!def) return;
  let rows = [...(db.custom[defId] || [])];

  // Search filter
  const searchVal = document.getElementById(`fil-custom-${defId}-search`)?.value?.toLowerCase() || '';
  if(searchVal){
    rows = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(searchVal)));
  }
  // Status filter
  const statusEl = document.getElementById(`fil-custom-${defId}-status`);
  if(statusEl && statusEl.value !== 'all'){
    rows = rows.filter(r => r.status === statusEl.value);
  }
  // Sort by date if exists
  if(def.columns.some(c=>c.key==='date')){
    rows.sort((a,b) => (b.date||'').localeCompare(a.date||''));
  }

  // KPI — sum all number/amount columns
  const amtCols = def.columns.filter(c => c.type === 'number' || c.type === 'rate');
  const allRows = db.custom[defId] || [];
  const activeRows = def.columns.some(c=>c.type==='status')
    ? allRows.filter(r => r.status === 'Active') : allRows;

  const kpiEl = document.getElementById(`kpi-custom-${defId}`);
  if(kpiEl){
    let kpiHtml = skpi('Total Entries', allRows.length, 'b');
    amtCols.forEach(col => {
      const total = activeRows.reduce((s,r) => s + (parseFloat(r[col.key]) || 0), 0);
      kpiHtml += skpi(col.label + (col.type==='number' ? ' (Active)' : ''), fmt(total), 'g');
    });
    kpiEl.innerHTML = kpiHtml;
  }

  // Table
  const tbody = document.querySelector(`#tbl-custom-${defId} tbody`);
  if(!tbody) return;

  if(!rows.length){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="${def.columns.length+1}">No entries yet. Click + Add Entry to start.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(r => {
    const cells = def.columns.map(col => {
      let val = r[col.key] ?? '—';
      if(col.type === 'date') val = fmtD(val);
      else if(col.type === 'number') val = `<span class="amt">${fmt(parseFloat(val)||0)}</span>`;
      else if(col.type === 'rate') val = val ? val + '% /yr' : '—';
      else if(col.type === 'status') val = statusBadge(val || 'Active');
      return `<td>${val}</td>`;
    }).join('');
    return `<tr>${cells}<td>
      <div class="act-btns">
        <button class="act act-edit" onclick="openCustomEditModal('${defId}','${r.id}')">Edit</button>
        <button class="act act-del" onclick="openCustomDeleteModal('${defId}','${r.id}')">Del</button>
      </div>
    </td></tr>`;
  }).join('');
}

// ── CUSTOM section nav ──
function nav_custom(defId){
  currentPage = 'custom-' + defId;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const pg = document.getElementById('page-custom-' + defId);
  if(pg) pg.classList.add('active');
  const nb = document.getElementById('nav-custom-' + defId);
  if(nb) nb.classList.add('active');
  const def = loadCustomDefs().find(d => d.id === defId);
  document.getElementById('topbar-title').textContent = (def?.icon||'📁') + ' ' + (def?.name||'Custom');
  document.querySelector('.topbar-actions').style.display = 'flex';
  renderCustomSection(defId);
}

// ── CUSTOM SECTION BUILDER MODAL ──
let _editingSection = null;
let _sectionColumns = [];

function openSectionBuilder(existingDef = null){
  _editingSection = existingDef;
  _sectionColumns = existingDef ? JSON.parse(JSON.stringify(existingDef.columns)) : [
    { key:'date', label:'Date', type:'date', isAmount:false },
    { key:'name', label:'Name', type:'text', isAmount:false },
    { key:'amount', label:'Amount', type:'number', isAmount:true },
    { key:'status', label:'Status', type:'status', isAmount:false },
  ];

  const modal = document.getElementById('modal-section-builder');
  document.getElementById('sb-name').value = existingDef?.name || '';
  document.getElementById('sb-icon').value = existingDef?.icon || '📁';
  renderColumnBuilder();
  modal.style.display = 'flex';
}

function closeSectionBuilder(){
  document.getElementById('modal-section-builder').style.display = 'none';
}

function renderColumnBuilder(){
  const container = document.getElementById('sb-columns');
  container.innerHTML = _sectionColumns.map((col, i) => `
    <div class="col-row" id="colrow-${i}">
      <div class="field" style="flex:1.5">
        <label>Column Label</label>
        <input type="text" value="${col.label}" onchange="updateColField(${i},'label',this.value)" placeholder="e.g. Bank Name"/>
      </div>
      <div class="field" style="flex:1">
        <label>Type</label>
        <select onchange="updateColField(${i},'type',this.value)">
          ${COLUMN_TYPES.map(t => `<option value="${t.value}" ${col.type===t.value?'selected':''}>${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="field" style="flex:0.8;display:${col.type==='select'?'block':'none'}" id="opts-${i}">
        <label>Options (comma separated)</label>
        <input type="text" value="${col.options||''}" onchange="updateColField(${i},'options',this.value)" placeholder="SBI,HDFC,ICICI"/>
      </div>
      <div style="display:flex;align-items:flex-end;padding-bottom:2px">
        <button class="act act-del" onclick="removeColumn(${i})" title="Remove column" style="padding:6px 10px">✕</button>
        ${i>0?`<button class="act act-edit" onclick="moveCol(${i},-1)" title="Move up" style="padding:6px 8px;margin-left:4px">↑</button>`:''}
        ${i<_sectionColumns.length-1?`<button class="act act-edit" onclick="moveCol(${i},1)" title="Move down" style="padding:6px 8px;margin-left:4px">↓</button>`:''}
      </div>
    </div>
  `).join('');
}

function updateColField(i, field, value){
  _sectionColumns[i][field] = value;
  if(field === 'label') _sectionColumns[i].key = value.toLowerCase().replace(/[^a-z0-9]/g,'_').replace(/_+/g,'_');
  if(field === 'type'){
    const opts = document.getElementById('opts-'+i);
    if(opts) opts.style.display = value === 'select' ? 'block' : 'none';
  }
}

function addColumnToBuilder(){
  _sectionColumns.push({ key:'col_'+uid().slice(0,4), label:'New Column', type:'text' });
  renderColumnBuilder();
}

function removeColumn(i){
  _sectionColumns.splice(i, 1);
  renderColumnBuilder();
}

function moveCol(i, dir){
  const j = i + dir;
  if(j < 0 || j >= _sectionColumns.length) return;
  [_sectionColumns[i], _sectionColumns[j]] = [_sectionColumns[j], _sectionColumns[i]];
  renderColumnBuilder();
}

function saveSectionDef(){
  const name = document.getElementById('sb-name').value.trim();
  const icon = document.getElementById('sb-icon').value.trim() || '📁';
  const errEl = document.getElementById('sb-err');
  errEl.style.display = 'none';

  if(!name){ errEl.textContent = 'Section name is required.'; errEl.style.display='block'; return; }
  if(_sectionColumns.length === 0){ errEl.textContent = 'Add at least one column.'; errEl.style.display='block'; return; }

  const defs = loadCustomDefs();

  if(_editingSection){
    // Update existing
    const idx = defs.findIndex(d => d.id === _editingSection.id);
    if(idx > -1){
      defs[idx] = { ...defs[idx], name, icon, columns: _sectionColumns };
      saveCustomDefs(defs);
      closeSectionBuilder();
      showToast('✓ Section updated');
      // Rebuild DOM
      const oldPage = document.getElementById('page-custom-'+_editingSection.id);
      if(oldPage) oldPage.remove();
      buildCustomSectionDOM(defs[idx]);
      nav_custom(_editingSection.id);
      ghSync();
    }
  } else {
    // Create new
    const newDef = {
      id: uid(),
      name, icon,
      sheetName: name.replace(/[^a-zA-Z0-9]/g,'_').slice(0,31),
      columns: _sectionColumns
    };
    defs.push(newDef);
    saveCustomDefs(defs);
    ensureCustomDb();
    db.custom[newDef.id] = [];
    closeSectionBuilder();
    buildCustomSectionDOM(newDef);
    nav_custom(newDef.id);
    showToast('✓ Section "' + name + '" created!');
    ghSync();
  }
}

// ── CUSTOM SECTION ADD/EDIT MODAL ──
let _customEntrySection = null, _customEntryId = null;

function openCustomAddModal(defId){
  const def = loadCustomDefs().find(d => d.id === defId);
  if(!def) return;
  _customEntrySection = defId;
  _customEntryId = null;
  renderCustomEntryForm(def, {});
  document.getElementById('cem-title').textContent = 'Add Entry — ' + def.name;
  document.getElementById('modal-custom-entry').style.display = 'flex';
}

function openCustomEditModal(defId, rowId){
  const def = loadCustomDefs().find(d => d.id === defId);
  ensureCustomDb();
  const row = (db.custom[defId]||[]).find(r => r.id === rowId);
  if(!def || !row) return;
  _customEntrySection = defId;
  _customEntryId = rowId;
  renderCustomEntryForm(def, row);
  document.getElementById('cem-title').textContent = 'Edit Entry — ' + def.name;
  document.getElementById('modal-custom-entry').style.display = 'flex';
}

function renderCustomEntryForm(def, data){
  const body = document.getElementById('cem-body');
  body.innerHTML = def.columns.map(col => {
    let input = '';
    const val = data[col.key] ?? '';
    if(col.type === 'date')
      input = `<input type="date" name="${col.key}" value="${val||new Date().toISOString().slice(0,10)}"/>`;
    else if(col.type === 'number')
      input = `<input type="number" name="${col.key}" value="${val}" placeholder="0"/>`;
    else if(col.type === 'rate')
      input = `<input type="number" name="${col.key}" value="${val}" placeholder="12" step="0.01"/>`;
    else if(col.type === 'status')
      input = `<select name="${col.key}"><option ${val==='Active'?'selected':''}>Active</option><option ${val==='Closed'?'selected':''}>Closed</option></select>`;
    else if(col.type === 'select'){
      const opts = (col.options||'').split(',').map(o=>o.trim()).filter(Boolean);
      input = `<select name="${col.key}">${opts.map(o=>`<option ${val===o?'selected':''}>${o}</option>`).join('')}</select>`;
    } else
      input = `<input type="text" name="${col.key}" value="${val}" placeholder="${col.label}"/>`;
    return `<div class="field"><label>${col.label}</label>${input}</div>`;
  }).join('');
}

function saveCustomEntry(){
  const def = loadCustomDefs().find(d => d.id === _customEntrySection);
  if(!def) return;
  const errEl = document.getElementById('cem-err');
  errEl.style.display = 'none';

  const data = {};
  document.querySelectorAll('#cem-body [name]').forEach(el => {
    data[el.name] = el.type === 'number' ? (parseFloat(el.value)||0) : el.value;
  });

  ensureCustomDb();
  if(!db.custom[def.id]) db.custom[def.id] = [];

  if(_customEntryId){
    const idx = db.custom[def.id].findIndex(r => r.id === _customEntryId);
    if(idx > -1) db.custom[def.id][idx] = { ...db.custom[def.id][idx], ...data };
  } else {
    db.custom[def.id].push({ id: uid(), ...data });
  }
  _dirty = true;

  document.getElementById('modal-custom-entry').style.display = 'none';
  renderCustomSection(_customEntrySection);
  renderDashboard();
  showToast(_customEntryId ? '✓ Updated' : '✓ Entry saved');
  ghSync();
}

function closeCustomEntryModal(){
  document.getElementById('modal-custom-entry').style.display = 'none';
}

// ── DELETE custom entry ──
let _customDelSection = null, _customDelId = null;

function openCustomDeleteModal(defId, rowId){
  _customDelSection = defId; _customDelId = rowId;
  document.getElementById('del-msg').textContent = 'Delete this entry? This cannot be undone.';
  document.getElementById('modal-del').style.display = 'flex';
  // Override confirm button
  document.getElementById('btn-confirm-del').onclick = confirmCustomDelete;
}

function confirmCustomDelete(){
  ensureCustomDb();
  if(db.custom[_customDelSection]){
    db.custom[_customDelSection] = db.custom[_customDelSection].filter(r => r.id !== _customDelId);
    _dirty = true;
  }
  document.getElementById('modal-del').style.display = 'none';
  renderCustomSection(_customDelSection);
  renderDashboard();
  showToast('✓ Deleted');
  ghSync();
}

// ── DELETE an entire custom section ──
function confirmDeleteSection(defId){
  if(!confirm('Delete this entire section and all its data? This cannot be undone.')) return;
  let defs = loadCustomDefs().filter(d => d.id !== defId);
  saveCustomDefs(defs);
  ensureCustomDb();
  delete db.custom[defId];
  _dirty = true;
  // Remove DOM
  document.getElementById('page-custom-'+defId)?.remove();
  document.getElementById('nav-custom-'+defId)?.remove();
  // Remove custom header if no more custom sections
  if(defs.length === 0) document.getElementById('nav-section-custom')?.remove();
  nav('dashboard');
  showToast('✓ Section deleted');
  ghSync();
}

// ── BOOT: load all custom sections ──
function bootCustomSections(wb){
  loadCustomSheetsFromWb(wb);
  const defs = loadCustomDefs();
  defs.forEach(def => buildCustomSectionDOM(def));
}

// ── DASHBOARD contribution from custom sections ──
function customSectionsTotalInvested(){
  ensureCustomDb();
  const defs = loadCustomDefs();
  let total = 0;
  defs.forEach(def => {
    const amtCols = def.columns.filter(c => c.type === 'number');
    const hasStatus = def.columns.some(c => c.type === 'status');
    const rows = (db.custom[def.id] || []);
    const active = hasStatus ? rows.filter(r => r.status === 'Active') : rows;
    amtCols.forEach(col => { total += active.reduce((s,r) => s+(parseFloat(r[col.key])||0), 0); });
  });
  return total;
}

function customSectionsSummaryRows(){
  ensureCustomDb();
  const defs = loadCustomDefs();
  return defs.map(def => {
    const amtCols = def.columns.filter(c => c.type === 'number');
    const hasStatus = def.columns.some(c => c.type === 'status');
    const rows = db.custom[def.id] || [];
    const active = hasStatus ? rows.filter(r => r.status === 'Active') : rows;
    const total = amtCols.reduce((s,col) => s+active.reduce((a,r)=>a+(parseFloat(r[col.key])||0),0), 0);
    return { label: def.icon + ' ' + def.name, count: active.length, amount: total };
  });
}

// ── Override openAddModal to handle custom sections ──
const _origOpenAddModal = typeof openAddModal !== 'undefined' ? openAddModal : null;
function openAddModal(page){
  if(page && page.startsWith('custom-')){
    const defId = page.replace('custom-','');
    openCustomAddModal(defId);
  } else if(_origOpenAddModal){
    _origOpenAddModal(page);
  }
}
