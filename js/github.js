// ── GITHUB LAYER ── robust sync with queue, retry, conflict resolution
const FILE_PATH = 'data/finance.xlsx';
let _cfg = null, _sha = null;

// ── Sync queue — prevents parallel PUTs racing each other ──
let _syncPending = false;   // a sync is in-flight
let _syncQueued  = false;   // another sync was requested while one was running
let _syncTimer   = null;    // debounce timer

function ghLoadConfig(){
  const s = localStorage.getItem('nf_cfg');
  if(s) try { _cfg = JSON.parse(s); } catch(e){}
  return _cfg;
}

function showConfig(){
  if(_cfg){
    document.getElementById('cfg-token').value  = _cfg.token  || '';
    document.getElementById('cfg-repo').value   = _cfg.repo   || '';
    document.getElementById('cfg-branch').value = _cfg.branch || 'main';
  }
  document.getElementById('modal-config').style.display = 'flex';
}

async function ghConnect(){
  const token  = document.getElementById('cfg-token').value.trim();
  const repo   = document.getElementById('cfg-repo').value.trim();
  const branch = document.getElementById('cfg-branch').value.trim() || 'main';
  const errEl  = document.getElementById('cfg-err');
  errEl.style.display = 'none';
  if(!token || !repo){
    errEl.textContent = 'Token and repository are required.';
    errEl.style.display = 'block'; return;
  }
  _cfg = { token, repo, branch };
  localStorage.setItem('nf_cfg', JSON.stringify(_cfg));
  await ghLoad();
}

// ── LOAD ──
async function ghLoad(){
  setSyncLbl('Loading from GitHub…');
  const errEl = document.getElementById('cfg-err');
  errEl.style.display = 'none';
  try {
    const res = await fetch(
      `https://api.github.com/repos/${_cfg.repo}/contents/${FILE_PATH}?ref=${_cfg.branch}&t=${Date.now()}`,
      { headers:{ Authorization:`token ${_cfg.token}`, Accept:'application/vnd.github.v3+json' } }
    );
    if(res.status === 404){
      // First time — no file yet
      const emptyWb = XLSX.utils.book_new();
      wbToDb(emptyWb);
      hideSyncLbl();
      bootApp(emptyWb);
      return;
    }
    if(!res.ok){
      const e = await res.json();
      throw new Error(e.message || `HTTP ${res.status}`);
    }
    const json = await res.json();
    _sha = json.sha;
    // Decode base64 → workbook (once)
    const wb = _b64ToWb(json.content);
    wbToDb(wb);
    hideSyncLbl();
    bootApp(wb);
  } catch(e) {
    errEl.textContent = 'Load error: ' + e.message;
    errEl.style.display = 'block';
    hideSyncLbl();
  }
}

function _b64ToWb(b64content){
  const bin   = atob(b64content.replace(/\n/g,''));
  const bytes = new Uint8Array(bin.length);
  for(let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return XLSX.read(bytes, { type:'array' });
}

// ── SYNC — debounced, queued, with retry ──
// Called after every data change. Debounces 1.5s so rapid edits batch into one PUT.
function ghSync(){
  if(!_cfg){ showConfig(); return; }
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(_doSync, 1500);
}

async function _doSync(){
  if(_syncPending){
    // Already syncing — mark that another sync is needed after this one finishes
    _syncQueued = true;
    return;
  }
  _syncPending = true;
  _syncQueued  = false;

  const btn = document.getElementById('sync-btn');
  if(btn){ btn.textContent = '⟳ Syncing…'; btn.disabled = true; }
  setSyncLbl('Saving…');

  let attempts = 0;
  while(attempts < 3){
    attempts++;
    try {
      // Always fetch the latest SHA before writing (avoids stale SHA conflicts)
      const shaRes = await fetch(
        `https://api.github.com/repos/${_cfg.repo}/contents/${FILE_PATH}?ref=${_cfg.branch}&t=${Date.now()}`,
        { headers:{ Authorization:`token ${_cfg.token}` } }
      );
      if(shaRes.ok){
        const j = await shaRes.json();
        _sha = j.sha;
      } else if(shaRes.status !== 404){
        // 404 is fine (first write); anything else is unexpected
        const e = await shaRes.json();
        throw new Error(e.message || `SHA fetch failed: ${shaRes.status}`);
      }

      const wb  = dbToWb();
      const b64 = XLSX.write(wb, { bookType:'xlsx', type:'base64' });
      const body = {
        message: `Finance update ${new Date().toISOString().slice(0,16).replace('T',' ')}`,
        content:  b64,
        branch:   _cfg.branch
      };
      if(_sha) body.sha = _sha;

      const putRes = await fetch(
        `https://api.github.com/repos/${_cfg.repo}/contents/${FILE_PATH}`,
        { method:'PUT',
          headers:{ Authorization:`token ${_cfg.token}`, 'Content-Type':'application/json' },
          body: JSON.stringify(body) }
      );

      if(putRes.ok){
        const result = await putRes.json();
        _sha   = result.content.sha;
        _dirty = false;
        showToast('✓ Synced');
        setSyncLbl('Synced ✓');
        setTimeout(hideSyncLbl, 2000);
        break; // success — exit retry loop
      }

      const err = await putRes.json();

      if(putRes.status === 409){
        // SHA conflict — GitHub rejected because file changed remotely
        // Clear our cached SHA and retry immediately
        _sha = null;
        setSyncLbl(`Conflict, retrying… (${attempts}/3)`);
        await _sleep(500 * attempts);
        continue;
      }

      if(putRes.status === 422){
        // Unprocessable — likely stale SHA too
        _sha = null;
        await _sleep(500 * attempts);
        continue;
      }

      // Other error — not retryable
      throw new Error(err.message || `HTTP ${putRes.status}`);

    } catch(e) {
      if(attempts >= 3){
        showToast('⚠ Sync failed: ' + e.message, true);
        setSyncLbl('Sync failed — tap Sync to retry');
        setTimeout(hideSyncLbl, 4000);
      } else {
        await _sleep(800 * attempts);
      }
    }
  }

  _syncPending = false;
  if(btn){ btn.textContent = '↑ Sync to GitHub'; btn.disabled = false; }

  // If another sync was requested while we were running, fire it now
  if(_syncQueued){
    _syncQueued = false;
    setTimeout(_doSync, 300);
  }
}

function _sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

// ── Sync status labels ──
function setSyncLbl(t){
  const el = document.getElementById('sync-lbl');
  if(el){ el.textContent = t; el.style.display = 'block'; }
}
function hideSyncLbl(){
  const el = document.getElementById('sync-lbl');
  if(el) el.style.display = 'none';
}
