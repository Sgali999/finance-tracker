// ── CHARTS ──
const _ch={};
function dc(id){ if(_ch[id]){ _ch[id].destroy(); delete _ch[id]; } }

const PALETTE=['#3b82f6','#22c55e','#f59e0b','#a855f7','#ef4444','#06b6d4','#f97316'];
const gridColor='#2a3349', tickColor='#7b8baa';
const baseOpts={ responsive:true, maintainAspectRatio:true,
  plugins:{ legend:{ labels:{ color:tickColor, font:{size:11}, padding:12, boxWidth:12 } } } };

function renderCharts(){
  renderDonut(); renderInterestBar(); renderExpenseBar();
}

function renderDonut(){
  dc('ch-donut');
  const secs=[{k:'ppf',l:'PPF'},{k:'fd',l:'FD'},{k:'business',l:'Business'},
    {k:'outside',l:'Outside Given'},{k:'stocks',l:'Stocks'},{k:'mf',l:'Mutual Funds'},{k:'lic',l:'LIC'}];
  const labels=[], data=[];
  secs.forEach(s=>{
    const v=db[s.k].filter(r=>r.status==='Active').reduce((a,r)=>a+r.amount,0);
    if(v>0){ labels.push(s.l); data.push(v); }
  });
  if(!data.length) return;
  _ch['ch-donut']=new Chart(document.getElementById('ch-donut'),{
    type:'doughnut',
    data:{ labels, datasets:[{ data, backgroundColor:PALETTE.slice(0,data.length), borderWidth:2, borderColor:'#161b27' }] },
    options:{ ...baseOpts, cutout:'60%',
      plugins:{ ...baseOpts.plugins,
        tooltip:{ callbacks:{ label:ctx=>' '+ctx.label+': '+fmt(ctx.raw) } }
      }
    }
  });
}

function renderInterestBar(){
  dc('ch-interest');
  const secs=[{k:'fd',l:'FD'},{k:'business',l:'Business'},{k:'outside',l:'Outside Given'}];
  const labels=secs.map(s=>s.l);
  const data=secs.map(s=>db[s.k].filter(r=>r.status==='Active').reduce((a,r)=>a+calcInterest(r.amount,r.rate,r.date),0));
  _ch['ch-interest']=new Chart(document.getElementById('ch-interest'),{
    type:'bar',
    data:{ labels, datasets:[{ label:'Interest Earned (₹)', data, backgroundColor:['rgba(245,158,11,.7)','rgba(168,85,247,.7)','rgba(6,182,212,.7)'], borderRadius:6 }] },
    options:{ ...baseOpts, plugins:{ ...baseOpts.plugins },
      scales:{
        x:{ ticks:{color:tickColor}, grid:{color:gridColor} },
        y:{ ticks:{color:tickColor, callback:v=>'₹'+v.toLocaleString('en-IN')}, grid:{color:gridColor} }
      }
    }
  });
}

function renderExpenseBar(){
  dc('ch-expense');
  // last 12 months
  const months=[];
  for(let i=11;i>=0;i--){
    const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-i);
    months.push(d.toISOString().slice(0,7));
  }
  const data=months.map(m=>db.expenses.filter(r=>r.date.startsWith(m)).reduce((s,r)=>s+r.amount,0));
  const labels=months.map(m=>{ const d=new Date(m+'-01'); return d.toLocaleString('en-IN',{month:'short',year:'2-digit'}); });
  _ch['ch-expense']=new Chart(document.getElementById('ch-expense'),{
    type:'bar',
    data:{ labels, datasets:[{ label:'Expenses (₹)', data, backgroundColor:'rgba(239,68,68,.65)', borderRadius:5 }] },
    options:{ ...baseOpts, plugins:{ ...baseOpts.plugins, legend:{display:false} },
      scales:{
        x:{ ticks:{color:tickColor,font:{size:10}}, grid:{color:gridColor} },
        y:{ ticks:{color:tickColor, callback:v=>'₹'+v.toLocaleString('en-IN')}, grid:{color:gridColor} }
      }
    }
  });
}
