import math
from base import *
rows = carregar()
IG=[r for r in rows if r['plataforma']=='Instagram']; IGs=[r for r in IG if r['sim']]
RIG=[r for r in IG if r['ret_ok'] and r['queda'] is not None]; RIGs=[r for r in RIG if r['sim']]
exp=esperado(IGs)
print('promessa/causal novos:')
for k in ['promessa_vazia','subhook_causal']:
    for nome,b in [('IG_todos',IG),('IG_sim',IGs)]:
        la,n=lift_aj(b,lambda r,k=k:r[k]); xs=[r for r in b if r[k]]
        print(f'  {k} {nome}: n={n} acerto {taxa(xs)*100:.1f}% aj {la:.2f} IC {boot_lift(b,lambda r,k=k:r[k])} cli {clientes_consist(b,lambda r,k=k:r[k])} Δhook {delta_cli([r for r in RIG if (r["sim"] or nome=="IG_todos")],"retencao_hook",lambda r,k=k:r[k]):+.1f}')
print('combo acabou+nome na base de retenção:')
for nome,b in [('ret IG todos',RIG),('ret IG sim',RIGs)]:
    xs=[r for r in b if r['combo_acabou_nome']]; la,_=lift_aj(b,lambda r:r['combo_acabou_nome'])
    print(f'  {nome}: n={len(xs)} acerto {taxa(xs)*100:.1f}% aj {la:.2f}')
print('sem Izabela (IG sim):')
semI=[r for r in IGs if r['cliente_nome']!='Izabela Anholett']
for k in ['acabou_de','abre_nome','combo_acabou_nome','conflito','guerra','pais_regiao','pergunta','primeira_pessoa','abre_esse','nostalgia','subhook_causal','abre_pais_ou_marca']:
    la,n=lift_aj(semI,lambda r,k=k:r[k]); xs=[r for r in semI if r[k]]
    nI=sum(1 for r in IGs if r[k] and r['cliente_nome']=='Izabela Anholett')
    print(f'  {k}: n={n} (Izabela tinha {nI}) acerto {taxa(xs)*100:.1f}% aj {la:.2f}')
print('guerra por cliente (IG sim):', C.Counter(r['cliente_nome'] for r in IGs if r['guerra']).most_common())
print('nostalgia por cliente (IG sim):', C.Counter(r['cliente_nome'] for r in IGs if r['nostalgia']).most_common(6))
print('abre_esse por cliente (IG sim, n>=10):')
por=C.defaultdict(list)
for r in IGs: por[r['cliente_nome']].append(r)
for c,xs in sorted(por.items()):
    a=[r for r in xs if r['abre_esse']]; b=[r for r in xs if not r['abre_esse']]
    if len(a)>=10: print(f'   {c} ({NICHO_DE.get(c)}): {taxa(a)*100:.0f}% (n={len(a)}) vs {taxa(b)*100:.0f}% (n={len(b)})')
print('abre_esse nao-script por cliente top:', C.Counter(r['cliente_nome'] for r in IG if r['abre_esse'] and not r['sim']).most_common(5))
print('imperio por nicho (IG sim / IG todos):')
for ni in NICHO:
    for nome,b in [('sim',IGs),('todos',IG)]:
        bb=[r for r in b if r['nicho']==ni]; xs=[r for r in bb if r['imperio']]; ys=[r for r in bb if not r['imperio']]
        if xs: print(f'   {ni} {nome}: {taxa(xs)*100:.1f}% (n={len(xs)}) vs {taxa(ys)*100:.1f}%')
print('panorama: pais x marca/nome x numero (abertura):')
M=[r for r in IGs if r['modo']=='panorama']
def g(r):
    if r['abre_pais']: return 'abre_pais'
    if r['abre_marca'] or r['abre_nome']: return 'abre_marca/nome'
    if r['abre_numero'] or r['num_1a_frase']: return 'numero_1a_frase'
    return 'outro'
for k in ['abre_pais','abre_marca/nome','numero_1a_frase','outro']:
    xs=[r for r in M if g(r)==k]; la,_=lift_aj(M,lambda r,k=k:g(r)==k,exp)
    rx=[r for r in xs if r['ret_ok'] and r['queda'] is not None]
    print(f'   {k}: n={len(xs)} acerto {taxa(xs)*100:.0f}% aj {la:.2f} clientes {len(set(cli(r) for r in xs))} | ret n={len(rx)} hook med {med([r["retencao_hook"] for r in rx])} Δhook {delta_cli(RIGs,"retencao_hook",lambda r,k=k: r["modo"]=="panorama" and g(r)==k):+.1f}')
print('panorama num_1a_frase por cliente:', C.Counter(r['cliente_nome'] for r in M if g(r)=='numero_1a_frase').most_common(8))
print('TT sim ret por modo: hook med / queda med')
RT=[r for r in rows if r['plataforma']=='TikTok' and r['sim'] and r['ret_ok'] and r['queda'] is not None]
for m in ['historia','mecanismo','demonstracao','panorama']:
    xs=[r for r in RT if r['modo']==m]; print('  ',m,len(xs),med([r['retencao_hook'] for r in xs]),med([r['queda'] for r in xs]), f"acerto {taxa(xs)*100:.0f}%")
print('IG sim modo publi/conselho n:', C.Counter(r['modo'] for r in IGs))
