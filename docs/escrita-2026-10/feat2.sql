with fv as (
 select f.video_id, v.crm_script_id, f.cliente_id, f.plataforma, f.coeficiente_viral,
  percent_rank() over w pr, count(*) over (partition by f.cliente_id, f.plataforma, date_trunc('quarter', f.data_publicacao)) nstr, f.classificacao, f.data_publicacao
 from oraculo.fato_video f join videos v on v.id=f.video_id
 where f.vm_script='sim' and not f.maturando and f.views_total>0 and v.crm_script_id is not null and f.coeficiente_viral is not null
 window w as (partition by f.cliente_id, f.plataforma, date_trunc('quarter', f.data_publicacao) order by f.coeficiente_viral)
), s as (select crm_script_id, avg(pr) mpr, min(cliente_id::text)::uuid cli, bool_or(classificacao='acerto') ac, max(data_publicacao) dp from fv where nstr>=10 group by 1),
sq as (select *, ntile(4) over (order by mpr) q from s),
codex as (select distinct on (session_id) client_id, coalesce(hook,'')||E'\n'||coalesce(roteiro,'')||E'\n'||coalesce(comando,'') t
  from vm_generated_scripts where created_at>now()-interval '60 days' and length(roteiro)>200 order by session_id, version desc),
codex_cli as (select distinct client_id from codex),
textos as (
 select 'codex' g, client_id cli, t from codex
 union all
 select case sq.q when 4 then 'h_topo' when 1 then 'h_base' end, sq.cli, c.script_text from sq join crm.scripts c on c.id=sq.crm_script_id
 union all
 select case when sq.ac then 'h_acerto' else 'h_sem_acerto' end, sq.cli, c.script_text from sq join crm.scripts c on c.id=sq.crm_script_id
 union all
 select 'h_ult60d', sq.cli, c.script_text from sq join crm.scripts c on c.id=sq.crm_script_id where sq.dp >= current_date-60
 union all
 select case sq.q when 4 then 'hmc_topo' when 1 then 'hmc_base' end, sq.cli, c.script_text from sq join crm.scripts c on c.id=sq.crm_script_id
   where sq.q in (1,4) and sq.cli in (select client_id from codex_cli)

),
clean as (select row_number() over () rid, g, cli, regexp_replace(regexp_replace(t, '\([^)]*\)|\[[^\]]*\]|\*', ' ', 'g'), '[ \t]+', ' ', 'g') t from textos where g is not null),
per as (
 select rid, g, cli, t, greatest(regexp_count(t,'\S+'),1)::numeric w,
  regexp_count(t,'\d+([.,]\d+)*') nums,
  regexp_count(t,'(?<=[^.!?:\n"“…][ \t])[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+') caps,
  regexp_count(t,'\m[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,}\M') acr,
  regexp_count(t,'\m(você|vocês|vc|cê|tu|teu|tua|teus|tuas)\M',1,'i') voce,
  regexp_count(t,'\m(porque|por isso|então|aí|com isso|o resultado)\M',1,'i') causal,
  regexp_count(t,'\m(mas|só que|porém)\M',1,'i') contr,
  regexp_count(t,'\mou seja\M',1,'i') ouseja,
  regexp_count(t,'\?') perg,
  regexp_count(t,'(?<!\m(em|de|para|pra|até|no|na|do|da|à|pela|pelo|com|entre|sobre) )\m(Pequim|Washington|Brasília|Planalto|Kremlin|Casa Branca)\M',1,'i') meton,
  regexp_count(t,'[^\n]*\S[^\n]*') paras
 from clean
),
sent as (
 select p.rid, count(*) ns, avg(sw) asl, avg((sw>25)::int) p25, avg((sw<5)::int) p5 from per p
  cross join lateral (select regexp_count(x,'\S+') sw from regexp_split_to_table(p.t, '[.!?…]+["”]?(\s+|$)|\n+') x where x ~ '\w') z
 group by 1
),
f as (
 select g, jsonb_build_object(
  'num_100w', 100*nums/w, 'caps_100w', 100*caps/w, 'acr_100w', 100*acr/w, 'voce_100w', 100*voce/w, 'causal_100w', 100*causal/w,
  'contr_100w', 100*contr/w, 'ouseja_100w', 100*ouseja/w, 'perg_100w', 100*perg/w, 'meton_100w', 100*meton/w,
  'palavras', w, 'paragrafos', paras, 'frase_media', s.asl, 'pct_frase_gt25', 100*s.p25, 'pct_frag_lt5', 100*s.p5, 'frases', s.ns) j
 from per join sent s using (rid)
)
select g, k feature, count(*) n, round(avg(v::numeric),3) mean, round(stddev(v::numeric),3) sd, round((percentile_cont(0.5) within group (order by v::numeric))::numeric,3) med
from f, jsonb_each_text(j) e(k,v) group by 1,2 order by 2,1
