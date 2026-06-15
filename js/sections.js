// ── CUSTOM SECTIONS ENGINE ──
// sectionType: 'investment' | 'deduction'
// Definitions stored in Excel sheet '_CustomDefs' so they sync across all devices
// Also mirrored to localStorage as a fast cache

const COLUMN_TYPES = [
  { value:'text',   label:'Text' },
  { value:'number', label:'Number (₹ Amount)' },
  { value:'date',   label:'Date' },
  { value:'rate',   label:'Rate (% per year)' },
  { value:'status', label:'Status (Active/Closed)' },
  { value:'select', label:'Dropdown (custom options)' },
];

const CUSTOM_DEFS_SHEET = '_CustomDefs';

// In-memory store for defs (loaded from Excel on boot)
let _customDefs = [];

function loadCustomDefs(){ return _customDefs; }

function saveCustomDefs(defs){
  _customDefs = defs;
  // Also cache in localStorage for fast access
  try { localStorage.setItem('nf_custom_sections', JSON.stringify(defs)); } catch(e){}
  _dirty = true; // Mark workbook dirty so it gets synced
}

function ensureCustomDb(){
  if(!db.custom) db.custom = {};
}

// ── Excel I/O ──
function loadCustomSheetsFromWb(wb){
  ensureCustomDb();

  // 1. Load definitions from Excel sheet '_CustomDefs'
  if(wb.SheetNames.includes(CUSTOM_DEFS_SHEET)){
    try{
      const defsRows = XLSX.utils.sheet_to_json(wb.Sheets[CUSTOM_DEFS_SHEET], {defval:''});
      if(defsRows.length > 0 && defsRows[0].defsJson){
        const parsed = JSON.parse(defsRows[0].defsJson);
        if(Array.isArray(parsed) && parsed.length > 0){
          _customDefs = parsed;
          // Sync to localStorage cache
          try { localStorage.setItem('nf_custom_sections', JSON.stringify(_customDefs)); } catch(e){}
        }
      }
    } catch(e){ console.warn('Failed to load custom defs from Excel:', e); }
  }

  // Fallback: if Excel has no defs, try localStorage (migration path)
  if(_customDefs.length === 0){
    try {
      const cached = JSON.parse(localStorage.getItem('nf_custom_sections') || '[]');
      if(Array.isArray(cached) && cached.length > 0){
        _customDefs = cached;
        // Will be written to Excel on next sync
        _dirty = true;
      }
    } catch(e){}
  }

  // 2. Load data rows for each custom section
  _customDefs.forEach(def => {
    const sn = def.sheetName || def.name;
    if(wb.SheetNames.includes(sn)){
      db.custom[def.id] = XLSX.utils.sheet_to_json(wb.Sheets[sn], {defval:'', raw:false})
        .map(r => {
          const fixed = { id: r.id || uid() };
          Object.keys(r).forEach(k => {
            const v = r[k];
            const col = def.columns.find(c => c.key === k);
            if(col && col.type === 'date') fixed[k] = safeDate(v);
            else if(col && col.type === 'number') fixed[k] = safeNum(v);
            else fixed[k] = v === null || v === undefined ? '' : String(v);
          });
          return fixed;
        });
    } else {
      db.custom[def.id] = db.custom[def.id] || [];
    }
  });
}

function writeCustomSheetsToWb(wb){
  ensureCustomDb();

  // 1. Write definitions to '_CustomDefs' sheet
  const defsJson = JSON.stringify(_customDefs);
  const defsSheet = XLSX.utils.json_to_sheet([{ defsJson }]);
  const defsIdx = wb.SheetNames.indexOf(CUSTOM_DEFS_SHEET);
  if(defsIdx > -1){ wb.SheetNames.splice(defsIdx,1); delete wb.Sheets[CUSTOM_DEFS_SHEET]; }
  XLSX.utils.book_append_sheet(wb, defsSheet, CUSTOM_DEFS_SHEET);

  // 2. Write data rows for each custom section
  _customDefs.forEach(def => {
    const sn = def.sheetName || def.name;
    const idx = wb.SheetNames.indexOf(sn);
    if(idx > -1){ wb.SheetNames.splice(idx,1); delete wb.Sheets[sn]; }
    const data = db.custom[def.id] || [];
    XLSX.utils.book_append_sheet(wb,
      data.length ? XLSX.utils.json_to_sheet(data) : XLSX.utils.aoa_to_sheet([[]]), sn);
  });
}

// ── Build DOM for a section ──
function buildCustomSectionDOM(def){
  const pageId = 'page-custom-' + def.id;
  if(document.getElementById(pageId)) return;

  const isDeduction = def.sectionType === 'deduction';
  // Auto-add Earned Interest column header if section has rate+amount+date
  const _rateC   = def.columns.find(c=>c.type==='rate');
  const _amtC    = def.columns.find(c=>c.type==='number');
  const _dateC   = def.columns.find(c=>c.type==='date');
  const _hasInt  = def.sectionType!=='deduction' && _rateC && _amtC && _dateC;
  const _isDeduct= def.sectionType==='deduction';
  const ths = (_isDeduct?'<th>#</th>':'') + def.columns.map(c=>`<th>${c.label}</th>`).join('') + (_hasInt?'<th>Earned Interest (Live)</th>':'') + '<th>Actions</th>';

  const page = document.createElement('div');
  page.className = 'page';
  page.id = pageId;
  page.innerHTML = `
    <div class="section-kpi-row" id="kpi-custom-${def.id}"></div>
    ${def.sectionType==='deduction' ? `<div class="field-hint" style="margin-bottom:12px">⬇️ This is a <strong>Deduction section</strong> — amounts entered here are deducted from your Wallet Balance.</div>` : ''}
    <div class="filter-bar">
      <input type="text" id="fil-custom-${def.id}-search" placeholder="Search…"
        oninput="renderCustomSection('${def.id}')" style="width:200px"/>
      <input type="month" id="fil-custom-${def.id}-month" onchange="renderCustomSection('${def.id}')"/>
    </div>
    <div class="card">
      <table class="tbl" id="tbl-custom-${def.id}">
        <thead><tr>${ths}</tr></thead>
        <tbody></tbody>
      </table>
    </div>`;

  const wrap = document.querySelector('.pages-wrap') || document.querySelector('.main-area');
  wrap.appendChild(page);
  addCustomNavItem(def);
}

function addCustomNavItem(def){
  const navId = 'nav-custom-' + def.id;
  if(document.getElementById(navId)) return;

  const isDeduction = def.sectionType === 'deduction';
  const groupId = isDeduction ? 'nav-group-deductions' : 'nav-group-investments-custom';
  const groupLabel = isDeduction ? '💳 Deductions' : '📁 Custom Investments';
  const parentGroupItems = document.getElementById('nav-custom-items');

  // Find or create sub-group inside custom sections
  let subGroup = document.getElementById(groupId);
  if(!subGroup && parentGroupItems){
    subGroup = document.createElement('div');
    subGroup.className = 'nav-sub-group';
    subGroup.id = groupId;
    subGroup.innerHTML = `<div class="nav-sub-label">${groupLabel}</div>`;
    parentGroupItems.appendChild(subGroup);
  }

  const btn = document.createElement('button');
  btn.className = 'nav-item';
  btn.id = navId;
  btn.dataset.page = 'custom-' + def.id;
  btn.innerHTML = `<span class="nav-icon">${def.icon||'📁'}</span> ${def.name}
    <button class="nav-section-del" onclick="event.stopPropagation();confirmDeleteSection('${def.id}')" title="Delete section">✕</button>`;
  btn.onclick = () => nav_custom(def.id);

  const target = subGroup || parentGroupItems;
  if(target) target.appendChild(btn);

  // Auto-expand custom sections group when items are added
  const customGroup = document.getElementById('nav-group-custom');
  if(customGroup && !customGroup.classList.contains('open')){
    customGroup.classList.add('open');
  }
}

// ── Render section table ──
function renderCustomSection(defId){
  ensureCustomDb();
  const def = loadCustomDefs().find(d=>d.id===defId);
  if(!def) return;

  let rows = [...(db.custom[defId] || [])];
  const searchVal = document.getElementById(`fil-custom-${defId}-search`)?.value?.toLowerCase()||'';
  if(searchVal) rows = rows.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(searchVal)));
  const monthVal = document.getElementById(`fil-custom-${defId}-month`)?.value||'';
  if(monthVal){
    const dateCol = def.columns.find(c=>c.type==='date');
    if(dateCol) rows = rows.filter(r=>(r[dateCol.key]||'').startsWith(monthVal));
  }
  if(def.columns.some(c=>c.key==='date')) rows.sort((a,b)=>(b.date||'').localeCompare(a.date||''));

  const isDeduction = def.sectionType === 'deduction';
  const allRows     = db.custom[defId] || [];

  // Detect if this section has interest calculation capability
  // Needs: a rate column + a number/amount column + a date column
  const rateCol   = def.columns.find(c=>c.type==='rate');
  const amtCol    = def.columns.find(c=>c.type==='number');
  const dateCol   = def.columns.find(c=>c.type==='date');
  const statusCol = def.columns.find(c=>c.type==='status');
  const hasInterest = !isDeduction && rateCol && amtCol && dateCol;

  // Compute live interest for active rows
  function rowInterest(r){
    if(!hasInterest) return 0;
    const isActive = !statusCol || r[statusCol.key] === 'Active' || !r[statusCol.key];
    if(!isActive) return 0;
    return calcInterest(parseFloat(r[amtCol.key])||0, parseFloat(r[rateCol.key])||0, r[dateCol.key]);
  }

  const amtCols = def.columns.filter(c=>c.type==='number');

  // ── KPI cards ──
  const activeRows = statusCol ? allRows.filter(r=>r[statusCol.key]==='Active'||!r[statusCol.key]) : allRows;
  const kpiEl = document.getElementById(`kpi-custom-${defId}`);
  if(kpiEl){
    let kpiHtml = skpi('Entries', allRows.length, 'b');
    amtCols.forEach(col=>{
      const total = activeRows.reduce((s,r)=>s+(parseFloat(r[col.key])||0),0);
      kpiHtml += skpi(col.label + (statusCol?' (Active)':''), fmt(total), isDeduction?'r':'g');
    });
    if(hasInterest){
      const totalInterest = activeRows.reduce((s,r)=>s+rowInterest(r),0);
      kpiHtml += skpi('Interest Earned (Live)', fmt(totalInterest), 'gold');
    }
    kpiEl.innerHTML = kpiHtml;
  }

  // ── Table ──
  const tbody = document.querySelector(`#tbl-custom-${defId} tbody`);
  if(!tbody) return;

  // Extra column count: S.No for deductions, Interest for rate sections
  const extraCols = (isDeduction?1:0) + (hasInterest?1:0);
  if(!rows.length){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="${def.columns.length + extraCols + 1}">No entries yet. Click + Add Entry to start.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((r, i) => {
    const cells = def.columns.map(col => {
      let val = r[col.key] ?? '—';
      if(col.type==='date') val = fmtD(val);
      else if(col.type==='number') val = `<span class="amt ${isDeduction?'amt-r':''}">${isDeduction?'-':''}${fmt(parseFloat(val)||0)}</span>`;
      else if(col.type==='rate') val = val?val+'% /yr':'—';
      else if(col.type==='status') val = statusBadge(val||'Active');
      return `<td>${val}</td>`;
    }).join('');

    const sno = isDeduction ? `<td style="color:var(--muted);font-size:.75rem">${i+1}</td>` : '';

    // Auto interest cell — only shown when row is active
    const isActive = !statusCol || r[statusCol.key]==='Active' || !r[statusCol.key];
    const interestCell = hasInterest
      ? `<td>${isActive ? `<span class="interest-live">${fmt(rowInterest(r))}</span>` : '<span style="color:var(--muted)">Closed</span>'}</td>`
      : '';

    return `<tr>${sno}${cells}${interestCell}<td>
      <div class="act-btns">
        <button class="act act-edit" onclick="openCustomEditModal('${defId}','${r.id}')">Edit</button>
        <button class="act act-del" onclick="openCustomDeleteModal('${defId}','${r.id}')">Del</button>
      </div>
    </td></tr>`;
  }).join('');
}

function nav_custom(defId){
  currentPage = 'custom-' + defId;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-custom-'+defId)?.classList.add('active');
  document.getElementById('nav-custom-'+defId)?.classList.add('active');
  const def = loadCustomDefs().find(d=>d.id===defId);
  document.getElementById('topbar-title').textContent = (def?.icon||'📁')+' '+(def?.name||'Custom');
  document.querySelector('.topbar-actions').style.display = 'flex';
  renderCustomSection(defId);
}

// ── SECTION BUILDER ──
let _editingSection = null, _sectionColumns = [], _sectionType = 'investment';

function openSectionBuilder(type='investment', existingDef=null){
  _editingSection = existingDef;
  _sectionType = existingDef?.sectionType || type;

  if(_sectionType === 'deduction'){
    _sectionColumns = existingDef ? JSON.parse(JSON.stringify(existingDef.columns)) : [
      { key:'date',   label:'Date',   type:'date'   },
      { key:'name',   label:'Name',   type:'text'   },
      { key:'amount', label:'Amount', type:'number' },
      { key:'notes',  label:'Notes',  type:'text'   },
    ];
  } else {
    _sectionColumns = existingDef ? JSON.parse(JSON.stringify(existingDef.columns)) : [
      { key:'date',   label:'Date',    type:'date'   },
      { key:'name',   label:'Name',    type:'text'   },
      { key:'amount', label:'Amount',  type:'number' },
      { key:'status', label:'Status',  type:'status' },
      { key:'notes',  label:'Notes / Other Details', type:'text' },
    ];
  }

  document.getElementById('sb-name').value = existingDef?.name || '';
  document.getElementById('sb-icon').value = existingDef?.icon || (_sectionType==='deduction'?'💳':'📁');
  document.getElementById('sb-type-label').textContent = _sectionType==='deduction' ? '⬇️ Deduction Section' : '📈 Investment Section';
  document.getElementById('sb-type-label').style.color = _sectionType==='deduction' ? 'var(--red)' : 'var(--green)';
  document.getElementById('sb-save-btn').textContent = existingDef ? 'Update Section' : (_sectionType==='deduction'?'Create Deduction Section':'Create Investment Section');
  renderColumnBuilder();
  document.getElementById('modal-section-builder').style.display = 'flex';
}

function closeSectionBuilder(){ document.getElementById('modal-section-builder').style.display='none'; }

function renderColumnBuilder(){
  document.getElementById('sb-columns').innerHTML = _sectionColumns.map((col,i) => `
    <div class="col-row">
      <div class="field" style="flex:1.5">
        <label>Column Label</label>
        <input type="text" value="${col.label}" onchange="updateColField(${i},'label',this.value)" placeholder="Column name"/>
      </div>
      <div class="field" style="flex:1">
        <label>Type</label>
        <select onchange="updateColField(${i},'type',this.value)">
          ${COLUMN_TYPES.map(t=>`<option value="${t.value}" ${col.type===t.value?'selected':''}>${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="field" style="flex:0.8;display:${col.type==='select'?'block':'none'}" id="opts-${i}">
        <label>Options (comma separated)</label>
        <input type="text" value="${col.options||''}" onchange="updateColField(${i},'options',this.value)" placeholder="Option1,Option2"/>
      </div>
      <div style="display:flex;align-items:flex-end;padding-bottom:2px;gap:3px">
        <button class="act act-del" onclick="removeColumn(${i})" title="Remove">✕</button>
        ${i>0?`<button class="act act-edit" onclick="moveCol(${i},-1)">↑</button>`:''}
        ${i<_sectionColumns.length-1?`<button class="act act-edit" onclick="moveCol(${i},1)">↓</button>`:''}
      </div>
    </div>`).join('');
}

function updateColField(i,field,value){
  _sectionColumns[i][field] = value;
  if(field==='label') _sectionColumns[i].key = value.toLowerCase().replace(/[^a-z0-9]/g,'_').replace(/_+/g,'_').slice(0,20);
  if(field==='type'){ const opts=document.getElementById('opts-'+i); if(opts) opts.style.display=value==='select'?'block':'none'; }
}
function addColumnToBuilder(){ _sectionColumns.push({key:'col_'+uid().slice(0,4),label:'New Column',type:'text'}); renderColumnBuilder(); }
function removeColumn(i){ _sectionColumns.splice(i,1); renderColumnBuilder(); }
function moveCol(i,dir){ const j=i+dir; if(j<0||j>=_sectionColumns.length)return; [_sectionColumns[i],_sectionColumns[j]]=[_sectionColumns[j],_sectionColumns[i]]; renderColumnBuilder(); }

function saveSectionDef(){
  const name = document.getElementById('sb-name').value.trim();
  const icon = document.getElementById('sb-icon').value.trim() || '📁';
  const errEl = document.getElementById('sb-err');
  errEl.style.display='none';
  if(!name){ errEl.textContent='Section name is required.'; errEl.style.display='block'; return; }
  if(_sectionColumns.length===0){ errEl.textContent='Add at least one column.'; errEl.style.display='block'; return; }

  const defs = loadCustomDefs();
  if(_editingSection){
    const idx = defs.findIndex(d=>d.id===_editingSection.id);
    if(idx>-1){
      defs[idx] = {...defs[idx], name, icon, columns:_sectionColumns};
      saveCustomDefs(defs);
      closeSectionBuilder();
      document.getElementById('page-custom-'+_editingSection.id)?.remove();
      buildCustomSectionDOM(defs[idx]);
      nav_custom(_editingSection.id);
      showToast('✓ Section updated'); ghSync();
    }
  } else {
    const newDef = { id:uid(), name, icon, sectionType:_sectionType,
      sheetName: name.replace(/[^a-zA-Z0-9]/g,'_').slice(0,31), columns:_sectionColumns };
    defs.push(newDef);
    saveCustomDefs(defs);
    ensureCustomDb();
    db.custom[newDef.id] = [];
    closeSectionBuilder();
    buildCustomSectionDOM(newDef);
    nav_custom(newDef.id);
    showToast('✓ Section "'+name+'" created!'); ghSync();
  }
}

// ── ENTRY MODAL ──
let _customEntrySection=null, _customEntryId=null;

function openCustomAddModal(defId){
  const def=loadCustomDefs().find(d=>d.id===defId); if(!def) return;
  _customEntrySection=defId; _customEntryId=null;
  renderCustomEntryForm(def,{});
  document.getElementById('cem-title').textContent='Add Entry — '+def.name;
  document.getElementById('modal-custom-entry').style.display='flex';
}
function openCustomEditModal(defId,rowId){
  const def=loadCustomDefs().find(d=>d.id===defId);
  ensureCustomDb();
  const row=(db.custom[defId]||[]).find(r=>r.id===rowId);
  if(!def||!row) return;
  _customEntrySection=defId; _customEntryId=rowId;
  renderCustomEntryForm(def,row);
  document.getElementById('cem-title').textContent='Edit Entry — '+def.name;
  document.getElementById('modal-custom-entry').style.display='flex';
}
function renderCustomEntryForm(def,data){
  document.getElementById('cem-body').innerHTML = def.columns.map(col=>{
    const val=data[col.key]??'';
    let input='';
    if(col.type==='date') input=`<input type="date" name="${col.key}" value="${val||new Date().toISOString().slice(0,10)}"/>`;
    else if(col.type==='number') input=`<input type="number" name="${col.key}" value="${val}" placeholder="0"/>`;
    else if(col.type==='rate') input=`<input type="number" name="${col.key}" value="${val}" placeholder="12" step="0.01"/>`;
    else if(col.type==='status') input=`<select name="${col.key}"><option ${val==='Active'?'selected':''}>Active</option><option ${val==='Closed'?'selected':''}>Closed</option></select>`;
    else if(col.type==='select'){ const opts=(col.options||'').split(',').map(o=>o.trim()).filter(Boolean); input=`<select name="${col.key}">${opts.map(o=>`<option ${val===o?'selected':''}>${o}</option>`).join('')}</select>`; }
    else input=`<input type="text" name="${col.key}" value="${val}" placeholder="${col.label}"/>`;
    return `<div class="field"><label>${col.label}</label>${input}</div>`;
  }).join('');
}
function saveCustomEntry(){
  const def=loadCustomDefs().find(d=>d.id===_customEntrySection); if(!def) return;
  const data={};
  document.querySelectorAll('#cem-body [name]').forEach(el=>{
    data[el.name]=el.type==='number'?(parseFloat(el.value)||0):el.value;
  });
  ensureCustomDb();
  if(!db.custom[def.id]) db.custom[def.id]=[];
  if(_customEntryId){
    const idx=db.custom[def.id].findIndex(r=>r.id===_customEntryId);
    if(idx>-1) db.custom[def.id][idx]={...db.custom[def.id][idx],...data};
  } else { db.custom[def.id].push({id:uid(),...data}); }
  _dirty=true;
  document.getElementById('modal-custom-entry').style.display='none';
  renderCustomSection(_customEntrySection);
  renderDashboard();
  showToast(_customEntryId?'✓ Updated':'✓ Entry saved'); ghSync();
}
function closeCustomEntryModal(){ document.getElementById('modal-custom-entry').style.display='none'; }

// ── DELETE ──
let _customDelSection=null, _customDelId=null;
function openCustomDeleteModal(defId,rowId){
  _customDelSection=defId; _customDelId=rowId;
  document.getElementById('del-msg').textContent='Delete this entry? This cannot be undone.';
  document.getElementById('modal-del').style.display='flex';
  document.getElementById('btn-confirm-del').onclick=confirmCustomDelete;
}
function confirmCustomDelete(){
  ensureCustomDb();
  if(db.custom[_customDelSection]){
    db.custom[_customDelSection]=db.custom[_customDelSection].filter(r=>r.id!==_customDelId);
    _dirty=true;
  }
  document.getElementById('modal-del').style.display='none';
  renderCustomSection(_customDelSection); renderDashboard();
  showToast('✓ Deleted'); ghSync();
}
function confirmDeleteSection(defId){
  if(!confirm('Delete this entire section and all its data?')) return;
  let defs=loadCustomDefs().filter(d=>d.id!==defId);
  saveCustomDefs(defs);
  ensureCustomDb(); delete db.custom[defId]; _dirty=true;
  document.getElementById('page-custom-'+defId)?.remove();
  document.getElementById('nav-custom-'+defId)?.remove();
  nav('dashboard'); showToast('✓ Section deleted'); ghSync();
}

// ── BOOT ──
function bootCustomSections(wb){
  loadCustomSheetsFromWb(wb);
  loadCustomDefs().forEach(def=>buildCustomSectionDOM(def));
  // If defs were migrated from localStorage to memory (not yet in Excel),
  // trigger a sync so they get written to the Excel file for other devices
  if(_dirty && typeof ghSync === 'function'){
    setTimeout(()=>{ ghSync(); }, 2000);
  }
}

// ── AGGREGATES for wallet/dashboard ──
function customSectionsTotalInvested(){
  ensureCustomDb();
  let total=0;
  loadCustomDefs().filter(d=>d.sectionType!=='deduction').forEach(def=>{
    const amtCols=def.columns.filter(c=>c.type==='number');
    const hasStatus=def.columns.some(c=>c.type==='status');
    const rows=db.custom[def.id]||[];
    const active=hasStatus?rows.filter(r=>r.status==='Active'):rows;
    amtCols.forEach(col=>{ total+=active.reduce((s,r)=>s+(parseFloat(r[col.key])||0),0); });
  });
  return total;
}
function customSectionsTotalInterest(){
  ensureCustomDb();
  let total=0;
  loadCustomDefs().filter(d=>d.sectionType!=='deduction').forEach(def=>{
    const rateCol=def.columns.find(c=>c.type==='rate');
    const amtCol=def.columns.find(c=>c.type==='number');
    const dateCol=def.columns.find(c=>c.type==='date');
    const statusCol=def.columns.find(c=>c.type==='status');
    if(!rateCol||!amtCol||!dateCol) return;
    const rows=db.custom[def.id]||[];
    const active=statusCol?rows.filter(r=>r[statusCol.key]==='Active'||!r[statusCol.key]):rows;
    active.forEach(r=>{
      total+=calcInterest(parseFloat(r[amtCol.key])||0, parseFloat(r[rateCol.key])||0, r[dateCol.key]);
    });
  });
  return total;
}
function customSectionsTotalDeductions(){
  ensureCustomDb();
  let total=0;
  loadCustomDefs().filter(d=>d.sectionType==='deduction').forEach(def=>{
    const amtCols=def.columns.filter(c=>c.type==='number');
    (db.custom[def.id]||[]).forEach(r=>{ amtCols.forEach(col=>{ total+=parseFloat(r[col.key])||0; }); });
  });
  return total;
}
function customSectionsSummaryRows(){
  ensureCustomDb();
  return loadCustomDefs().map(def=>{
    const isDeduction=def.sectionType==='deduction';
    const amtCols=def.columns.filter(c=>c.type==='number');
    const hasStatus=def.columns.some(c=>c.type==='status');
    const rateCol=def.columns.find(c=>c.type==='rate');
    const amtCol=def.columns.find(c=>c.type==='number');
    const dateCol=def.columns.find(c=>c.type==='date');
    const statusCol=def.columns.find(c=>c.type==='status');
    const rows=db.custom[def.id]||[];
    const active=hasStatus?rows.filter(r=>r[statusCol?.key]==='Active'||!r[statusCol?.key]):rows;
    const total=amtCols.reduce((s,col)=>s+active.reduce((a,r)=>a+(parseFloat(r[col.key])||0),0),0);
    let interest=null;
    if(!isDeduction && rateCol && amtCol && dateCol){
      interest=active.reduce((s,r)=>s+calcInterest(parseFloat(r[amtCol.key])||0,parseFloat(r[rateCol.key])||0,r[dateCol.key]),0);
    }
    return { label:def.icon+' '+def.name, count:active.length, amount:total, isDeduction, interest };
  });
}

// openAddModal is defined in forms.js as a single clean dispatcher

