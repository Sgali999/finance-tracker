// ── GITHUB LAYER ──
const FILE_PATH = 'data/finance.xlsx';
let _cfg = null, _sha = null;

let _syncPending = false;
let _syncQueued  = false;
let _syncTimer   = null;

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
    const res = await _ghGet();
    if(res.status === 404){
      const emptyWb = XLSX.utils.book_new();
      wbToDb(emptyWb);
      hideSyncLbl();
      bootApp(emptyWb);
      return;
    }
    if(!res.ok){ const e = await res.json(); throw new Error(e.message || `HTTP ${res.status}`); }
    const json = await res.json();
    _sha = json.sha;
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

function _b64ToWb(b64){
  const bin = atob(b64.replace(/\n/g,''));
  const bytes = new Uint8Array(bin.length);
  for(let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return XLSX.read(bytes, { type:'array' });
}

// Cache-busted GET for the file
function _ghGet(){
  return fetch(
    `https://api.github.com/repos/${_cfg.repo}/contents/${FILE_PATH}?ref=${_cfg.branch}&_=${Date.now()}`,
    { headers:{ Authorization:`token ${_cfg.token}`, Accept:'application/vnd.github.v3+json',
                'Cache-Control':'no-cache' } }
  );
}

// ── SYNC — debounced entry point called after every data change ──
function ghSync(){
  if(!_cfg){ showConfig(); return; }
  // Always reset the debounce timer — rapid changes collapse into one sync
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(()=>{
    if(_syncPending){
      // A sync is already running — queue one more for after it finishes
      _syncQueued = true;
    } else {
      _doSync();
    }
  }, 1200);
}

// ── Core sync — always fetches a fresh SHA, retries on conflict ──
async function _doSync(){
  _syncPending = true;
  _syncQueued  = false;

  const btn = document.getElementById('sync-btn');
  if(btn){ btn.textContent = '⟳ Syncing…'; btn.disabled = true; }
  setSyncLbl('Saving…');

  let success = false;

  for(let attempt = 1; attempt <= 4; attempt++){
    try {
      // ── Step 1: always get the freshest SHA from GitHub ──
      // Small delay on retry to let GitHub's CDN propagate the previous write
      if(attempt > 1) await _sleep(600 * attempt);

      const shaRes = await _ghGet();
      if(shaRes.ok){
        const j = await shaRes.json();
        _sha = j.sha;           // always overwrite with what GitHub says
      } else if(shaRes.status === 404){
        _sha = null;            // file doesn't exist yet — first write
      } else {
        const e = await shaRes.json();
        throw new Error(e.message || `SHA fetch HTTP ${shaRes.status}`);
      }

      // ── Step 2: build workbook from current in-memory state ──
      const wb  = dbToWb();
      const b64 = XLSX.write(wb, { bookType:'xlsx', type:'base64' });
      const body = {
        message: `Finance update ${new Date().toISOString().slice(0,16).replace('T',' ')}`,
        content:  b64,
        branch:   _cfg.branch
      };
      if(_sha) body.sha = _sha;   // required if file already exists

      // ── Step 3: PUT to GitHub ──
      const putRes = await fetch(
        `https://api.github.com/repos/${_cfg.repo}/contents/${FILE_PATH}`,
        { method:'PUT',
          headers:{ Authorization:`token ${_cfg.token}`, 'Content-Type':'application/json' },
          body: JSON.stringify(body) }
      );

      if(putRes.ok){
        const result = await putRes.json();
        _sha   = result.content.sha;   // store new SHA for next sync
        _dirty = false;
        showToast('✓ Saved');
        setSyncLbl('Synced ✓');
        setTimeout(hideSyncLbl, 2000);
        success = true;
        break;
      }

      // ── Handle specific GitHub error codes ──
      let errMsg = `HTTP ${putRes.status}`;
      try { errMsg = (await putRes.json()).message || errMsg; } catch(_){}

      if(putRes.status === 409 || putRes.status === 422){
        // Conflict or unprocessable — SHA mismatch
        // Force re-fetch on next attempt (already done at top of loop)
        _sha = null;
        setSyncLbl(`SHA conflict, retrying (${attempt}/4)…`);
        continue;  // retry
      }

      if(putRes.status === 401 || putRes.status === 403){
        throw new Error('Token expired or no write permission. Go to ⚙ Settings and reconnect.');
      }

      throw new Error(errMsg);  // non-retryable

    } catch(e) {
      if(attempt >= 4){
        showToast('⚠ Sync failed: ' + e.message, true);
        setSyncLbl('Sync failed — press Sync to retry');
        setTimeout(hideSyncLbl, 5000);
      }
      // else loop continues with next attempt
    }
  }

  _syncPending = false;
  if(btn){ btn.textContent = '↑ Sync to GitHub'; btn.disabled = false; }

  // If more changes happened while we were syncing, do one more sync
  // Wait a beat so GitHub's CDN propagates our write first
  if(_syncQueued){
    _syncQueued = false;
    setTimeout(_doSync, 1000);   // 1s gap — lets GitHub settle before next write
  }
}

function _sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

function setSyncLbl(t){
  const el = document.getElementById('sync-lbl');
  if(el){ el.textContent = t; el.style.display = 'block'; }
}
function hideSyncLbl(){
  const el = document.getElementById('sync-lbl');
  if(el) el.style.display = 'none';
}
