import math, json, sys
from base import *

rows = carregar()
for r in rows: r['lc'] = math.log10((r['coeficiente_viral'] or 0) + 0.01)
IG = [r for r in rows if r['plataforma'] == 'Instagram']
IGs = [r for r in IG if r['sim']]
TT = [r for r in rows if r['plataforma'] == 'TikTok']
TTs = [r for r in TT if r['sim']]
print('IG all', len(IG), round(taxa(IG)*100,1), '| IG sim', len(IGs), round(taxa(IGs)*100,1), '| IG sim com modo', sum(1 for r in IGs if r['modo']))
print('TT all', len(TT), round(taxa(TT)*100,1), '| TT sim', len(TTs), round(taxa(TTs)*100,1))
RIG = [r for r in IG if r['ret_ok']]; RIGs = [r for r in RIG if r['sim']]
RTT = [r for r in TT if r['ret_ok']]; RTTs = [r for r in RTT if r['sim']]
print('ret IG', len(RIG), round(taxa(RIG)*100,1), 'sim', len(RIGs), round(taxa(RIGs)*100,1), '| ret TT', len(RTT), 'sim', len(RTTs), round(taxa(RTTs)*100,1))

def linha(nome, base, pred, rbase=None, boot=True):
    a = [r for r in base if pred(r)]; b = [r for r in base if not pred(r)]
    la, n = lift_aj(base, pred)
    ic = boot_lift(base, pred) if boot and n >= 15 else (float('nan'),)*2
    f, ne, z = clientes_consist(base, pred)
    dh = delta_cli(rbase, 'retencao_hook', pred) if rbase else float('nan')
    dq = delta_cli(rbase, 'queda', pred) if rbase else float('nan')
    nr = sum(1 for r in rbase if pred(r)) if rbase else 0
    dc = delta_cli(base, 'lc', pred)
    return dict(feat=nome, n=n, ncli=len(set(cli(r) for r in a)), com=taxa(a)*100, sem=taxa(b)*100, lift_aj=la, ic=ic, cli=f'{f}/{ne}/{z}', nret=nr, dhook=dh, dqueda=dq, dlogcoef=dc)

FEATS = ['acabou_de','abre_nome','combo_acabou_nome','conflito','choque','guerra','davi_golias','pais_regiao','marca_grande','abre_esse','abre_voce','se_voce','pergunta','primeira_pessoa','abre_1a_pessoa','numero','num_1a_frase','abre_numero','abre_pais_ou_marca','ninguem_sabe','nostalgia','subhook_causal','promessa_vazia','lista_numerada','acusar_espectador','imagina','contexto_serie','nome_revelacao','imperio']

def fmt(d):
    ic = d['ic']; ics = f"{ic[0]:.2f}–{ic[1]:.2f}" if ic[0]==ic[0] else '–'
    return f"| {d['feat']} | {d['n']} ({d['ncli']}) | {d['com']:.1f} / {d['sem']:.1f} | {d['lift_aj']:.2f} | {ics} | {d['cli']} | {d['nret']} | {d['dhook']:+.1f} | {d['dqueda']:+.1f} | {d['dlogcoef']:+.2f} |"

H = "| feature | n (clientes) | acerto com / sem % | lift aj. | IC90 (boot cliente) | clientes func/neutro/falha (≥8) | n ret | Δ hook vs cli | Δ queda vs cli | Δ log10 coef vs cli |\n|---|---|---|---|---|---|---|---|---|---|"
res = {}
for nome, base, rb in [('IG_todos', IG, RIG), ('IG_sim', IGs, RIGs), ('TT_sim', TTs, RTTs)]:
    print(f"\n### {nome}\n" + H)
    res[nome] = []
    for k in FEATS:
        d = linha(k, base, lambda r, k=k: r[k], rb, boot=(nome != 'TT_sim'))
        res[nome].append(d); print(fmt(d))

# MGC do playbook (só vídeos com classificação de playbook)
print('\n### Nº de MGCs do playbook')
for nome, base in [('IG_todos', IG), ('IG_sim', IGs), ('TT_sim', TTs)]:
    pbb = [r for r in base if r['cats'] is not None]
    out = []
    for k, p in [('0', lambda r: len(r['cats']) == 0), ('1', lambda r: len(r['cats']) == 1), ('2', lambda r: len(r['cats']) == 2), ('3+', lambda r: len(r['cats']) >= 3)]:
        xs = [r for r in pbb if p(r)]; la, _ = lift_aj(pbb, p)
        out.append(f"{k}: {taxa(xs)*100:.1f}% (n={len(xs)}, aj {la:.2f})")
    print(nome, f'cobertura {len(pbb)}/{len(base)}', ' · '.join(out))
    for par in [('esse_cara','o_proibido'), ('conflito_declarado','contraste_extremo'), ('desafio_de_crenca','vies_de_negatividade'), ('elemento_controverso','esse_cara')]:
        p = lambda r, par=par: all(c in r['cats'] for c in par)
        xs = [r for r in pbb if p(r)]; la, _ = lift_aj(pbb, p)
        print(f"  par {'+'.join(par)}: {taxa(xs)*100:.1f}% n={len(xs)} aj {la:.2f}")
    p = lambda r: any(c in r['cats'] for c in ('esse_cara','elemento_controverso')) and any(c in r['cats'] for c in ('o_proibido','conflito_declarado','contraste_extremo'))
    xs = [r for r in pbb if p(r)]; la, _ = lift_aj(pbb, p); print(f"  personagem+tensão (amplo): {taxa(xs)*100:.1f}% n={len(xs)} aj {la:.2f} cli {clientes_consist(pbb,p)}")
    for c in ['desafio_de_crenca']:
        for lab, q in [('com abre_nome/marca', lambda r: r['abre_nome'] or r['marca_grande']), ('sem', lambda r: not (r['abre_nome'] or r['marca_grande']))]:
            p = lambda r, q=q: c in r['cats'] and q(r)
            xs = [r for r in pbb if p(r)]; la, _ = lift_aj(pbb, p); print(f"  {c} {lab}: {taxa(xs)*100:.1f}% n={len(xs)} aj {la:.2f}")

# sentimentos: lift = % nos acertos / % nos não-acertos (rank 1-2)
print('\n### Sentimentos (lift acertos/não-acertos)')
for nome, base in [('IG_todos', IG), ('IG_sim', IGs)]:
    bb = [r for r in base if r['sent12']]; A = [r for r in bb if r['acerto']]; N = [r for r in bb if not r['acerto']]
    s = []
    for se in ['AUTORIDADE','DIDATISMO','ADMIRAÇÃO','ESCÂNDALO','INDIGNAÇÃO','CURIOSIDADE','CONFIANÇA','NOSTALGIA']:
        pa = sum(se in r['sent12'] for r in A)/len(A); pn = sum(se in r['sent12'] for r in N)/len(N)
        s.append(f"{se} {pa/pn:.2f}" if pn else f"{se} –")
    print(nome, f'(acertos {len(A)} x {len(N)})', ' · '.join(s))

# Esse/Essa por nicho
print('\n### abre_esse por nicho (lift aj.)')
for nome, base in [('IG_todos', IG), ('IG_sim', IGs)]:
    exp = esperado(base); s = []
    for ni in NICHO:
        bb = [r for r in base if r['nicho'] == ni]
        la, n = lift_aj(bb, lambda r: r['abre_esse'], exp)
        s.append(f"{ni} {la:.2f} (n={n})")
    print(nome, ' · '.join(s))

json.dump(res, open(D/'parte_a.json','w'), default=str, ensure_ascii=False)
