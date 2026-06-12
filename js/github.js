// ── GITHUB LAYER ──
const FILE_PATH = 'data/finance.xlsx';
let _cfg = null, _sha = null;

function ghLoadConfig(){ const s=localStorage.getItem('nf_cfg'); if(s) _cfg=JSON.parse(s); return _cfg; }

function showConfig(){
  if(_cfg){ document.getElementById('cfg-token').value=_cfg.token||''; document.getElementById('cfg-repo').value=_cfg.repo||''; document.getElementById('cfg-branch').value=_cfg.branch||'main'; }
  document.getElementById('modal-config').style.display='flex';
}

async function ghConnect(){
  const token  = document.getElementById('cfg-token').value.trim();
  const repo   = document.getElementById('cfg-repo').value.trim();
  const branch = document.getElementById('cfg-branch').value.trim()||'main';
  const errEl  = document.getElementById('cfg-err');
  errEl.style.display='none';
  if(!token||!repo){ errEl.textContent='Token and repository are required.'; errEl.style.display='block'; return; }
  _cfg={token,repo,branch};
  localStorage.setItem('nf_cfg',JSON.stringify(_cfg));
  await ghLoad();
}

async function ghLoad(){
  setSyncLbl('Loading from GitHub…');
  const errEl = document.getElementById('cfg-err');
  try{
    const res = await fetch(`https://api.github.com/repos/${_cfg.repo}/contents/${FILE_PATH}?ref=${_cfg.branch}`,
      { headers:{ Authorization:`token ${_cfg.token}`, Accept:'application/vnd.github.v3+json' } });
    if(res.status===404){
      wbToDb(XLSX.utils.book_new());
      hideSyncLbl();
      bootApp();
      return;
    }
    if(!res.ok){ const e=await res.json(); throw new Error(e.message||res.status); }
    const json=await res.json();
    _sha = json.sha;
    const bin=atob(json.content.replace(/\n/g,''));
    const bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    wbToDb(XLSX.read(bytes,{type:'array'}));
    hideSyncLbl();
    bootApp();
  }catch(e){
    errEl.textContent='Error: '+e.message;
    errEl.style.display='block';
    hideSyncLbl();
  }
}

async function ghSync(){
  if(!_cfg){ showConfig(); return; }
  const btn=document.getElementById('sync-btn');
  btn.textContent='⟳ Syncing…'; btn.disabled=true;
  setSyncLbl('Saving to GitHub…');
  try{
    // fetch latest SHA
    const headRes=await fetch(`https://api.github.com/repos/${_cfg.repo}/contents/${FILE_PATH}?ref=${_cfg.branch}`,
      { headers:{ Authorization:`token ${_cfg.token}` } });
    if(headRes.ok){ const j=await headRes.json(); _sha=j.sha; }

    const wb=dbToWb();
    const b64=XLSX.write(wb,{bookType:'xlsx',type:'base64'});
    const body={message:`Finance update ${new Date().toISOString().slice(0,10)}`,content:b64,branch:_cfg.branch};
    if(_sha) body.sha=_sha;

    const putRes=await fetch(`https://api.github.com/repos/${_cfg.repo}/contents/${FILE_PATH}`,
      { method:'PUT', headers:{ Authorization:`token ${_cfg.token}`, 'Content-Type':'application/json' }, body:JSON.stringify(body) });
    if(!putRes.ok){ const e=await putRes.json(); throw new Error(e.message||putRes.status); }
    const result=await putRes.json();
    _sha=result.content.sha;
    _dirty=false;
    showToast('✓ Synced to GitHub');
    setSyncLbl('Synced ✓'); setTimeout(hideSyncLbl,2000);
  }catch(e){
    showToast('⚠ Sync failed: '+e.message, true);
    hideSyncLbl();
  }finally{
    btn.textContent='↑ Sync to GitHub'; btn.disabled=false;
  }
}

function setSyncLbl(t){ const el=document.getElementById('sync-lbl'); el.textContent=t; el.style.display='block'; }
function hideSyncLbl(){ document.getElementById('sync-lbl').style.display='none'; }
