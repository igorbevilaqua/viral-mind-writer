import { readFileSync, writeFileSync } from "node:fs";
const V = JSON.parse(readFileSync("data/videos.json","utf8")).filter(v=>v.analisavel);
const N = JSON.parse(readFileSync("data/nichos.json","utf8"));
const nicho = {}; for (const r of N.sort((a,b)=>(b.peso??0)-(a.peso??0))) (nicho[r.cliente_id] ??= []).push(r.nicho);
const med = a => { const b=[...a].sort((x,y)=>x-y); return b.length? b[Math.floor(b.length/2)] : null; };
const cli = {};
for (const v of V) { const c = (cli[v.cliente] ??= { id: v.cliente_id, plat: {} }); const p = (c.plat[v.plataforma] ??= []); p.push(v); }
const linhas = [];
for (const [nome, c] of Object.entries(cli)) {
  const tot = Object.values(c.plat).flat();
  const r = { cliente: nome, nichos: (nicho[c.id]??[]).slice(0,3).join("/"), n: tot.length, scripts: new Set(tot.map(v=>v.script_id)).size };
  for (const [p, vs] of Object.entries(c.plat)) r[p] = `${vs.length}·${(100*vs.filter(v=>v.acerto).length/vs.length).toFixed(0)}%·${med(vs.map(v=>v.coef)).toFixed(2)}`;
  linhas.push(r);
}
linhas.sort((a,b)=>b.n-a.n);
console.log("cliente | nichos | videos | roteiros | IG n·%acerto·coefmed | TT | YT | FB");
for (const r of linhas) console.log([r.cliente, r.nichos, r.n, r.scripts, r.Instagram??"-", r.TikTok??"-", r.YouTube??"-", r.Facebook??"-"].join(" | "));
// correlação de percentil entre plataformas, mesmo roteiro
const porS = {}; for (const v of V) if (v.p_coef!=null) (porS[v.script_id] ??= {})[v.plataforma] = v.p_coef;
const P = ["Instagram","TikTok","YouTube","Facebook"];
const corr = (x,y)=>{const n=x.length, mx=x.reduce((a,b)=>a+b,0)/n, my=y.reduce((a,b)=>a+b,0)/n; let sxy=0,sx=0,sy=0; for(let i=0;i<n;i++){sxy+=(x[i]-mx)*(y[i]-my); sx+=(x[i]-mx)**2; sy+=(y[i]-my)**2} return sxy/Math.sqrt(sx*sy)};
for (let i=0;i<P.length;i++) for (let j=i+1;j<P.length;j++) { const x=[],y=[]; for (const s of Object.values(porS)) if (s[P[i]]!=null && s[P[j]]!=null){x.push(s[P[i]]);y.push(s[P[j]])} if (x.length>30) console.log(`corr percentil ${P[i]} x ${P[j]}: r=${corr(x,y).toFixed(2)} n=${x.length}`); }
writeFileSync("data/panorama.json", JSON.stringify({ linhas, nicho }));
