// ── GITHUB API LAYER ──
const EXCEL_PATH = 'data/finance.xlsx';
let ghConfig = null;

function loadConfig() {
  const saved = localStorage.getItem('nf_config');
  if (saved) ghConfig = JSON.parse(saved);
  return ghConfig;
}

function saveConfig() {
  const token = document.getElementById('cfg-token').value.trim();
  const repo = document.getElementById('cfg-repo').value.trim();
  const branch = document.getElementById('cfg-branch').value.trim() || 'main';

  if (!token || !repo) {
    showConfigError('Please fill in token and repository.');
    return;
  }

  ghConfig = { token, repo, branch };
  localStorage.setItem('nf_config', JSON.stringify(ghConfig));
  loadFromGitHub();
}

function showConfig() {
  if (ghConfig) {
    document.getElementById('cfg-token').value = ghConfig.token || '';
    document.getElementById('cfg-repo').value = ghConfig.repo || '';
    document.getElementById('cfg-branch').value = ghConfig.branch || 'main';
  }
  document.getElementById('config-modal').style.display = 'flex';
}

function showConfigError(msg) {
  const el = document.getElementById('config-error');
  el.textContent = msg;
  el.style.display = 'block';
}

// ── LOAD from GitHub ──
async function loadFromGitHub() {
  setSyncStatus('Loading from GitHub…');
  document.getElementById('config-error').style.display = 'none';

  try {
    const url = `https://api.github.com/repos/${ghConfig.repo}/contents/${EXCEL_PATH}?ref=${ghConfig.branch}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `token ${ghConfig.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (res.status === 404) {
      // File doesn't exist yet — start fresh
      workbookToState(XLSX.utils.book_new());
      hideSyncStatus();
      document.getElementById('config-modal').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      if (!state.meta.setupDone) showSetupWizard();
      else renderAll();
      return;
    }

    if (!res.ok) {
      const err = await res.json();
      showConfigError('GitHub error: ' + (err.message || res.status));
      hideSyncStatus();
      return;
    }

    const json = await res.json();
    const binary = atob(json.content.replace(/\n/g,''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const wb = XLSX.read(bytes, {type: 'array'});
    workbookToState(wb);

    document.getElementById('config-modal').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    if (!state.meta.setupDone) showSetupWizard();
    else renderAll();
    setSyncStatus('Loaded ✓');
    setTimeout(hideSyncStatus, 2000);

  } catch (e) {
    showConfigError('Connection failed: ' + e.message);
    hideSyncStatus();
  }
}

// ── SAVE to GitHub ──
let _fileSha = null;

async function syncToGitHub() {
  if (!ghConfig) { showConfig(); return; }
  setSyncStatus('Syncing…');
  const btn = document.getElementById('sync-btn');
  btn.textContent = '⟳ Syncing…';
  btn.disabled = true;

  try {
    // Get current SHA if exists
    let sha = _fileSha;
    if (!sha) {
      const res = await fetch(
        `https://api.github.com/repos/${ghConfig.repo}/contents/${EXCEL_PATH}?ref=${ghConfig.branch}`,
        { headers: { 'Authorization': `token ${ghConfig.token}` } }
      );
      if (res.ok) {
        const j = await res.json();
        sha = j.sha;
        _fileSha = sha;
      }
    }

    // Build workbook and base64 encode
    const wb = stateToWorkbook();
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

    const body = {
      message: `Finance update ${new Date().toISOString().slice(0,10)}`,
      content: wbout,
      branch: ghConfig.branch
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(
      `https://api.github.com/repos/${ghConfig.repo}/contents/${EXCEL_PATH}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${ghConfig.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error(err.message || putRes.status);
    }

    const result = await putRes.json();
    _fileSha = result.content.sha;
    state.dirty = false;
    showToast('✓ Synced to GitHub');
    setSyncStatus('Synced ✓');
    setTimeout(hideSyncStatus, 2000);

  } catch (e) {
    showToast('⚠ Sync failed: ' + e.message, true);
    setSyncStatus('Sync failed');
  } finally {
    btn.textContent = '↑ Sync';
    btn.disabled = false;
  }
}

// ── Sync status ──
function setSyncStatus(msg) {
  const el = document.getElementById('sync-status');
  el.textContent = msg;
  el.style.display = 'block';
}
function hideSyncStatus() {
  document.getElementById('sync-status').style.display = 'none';
}
