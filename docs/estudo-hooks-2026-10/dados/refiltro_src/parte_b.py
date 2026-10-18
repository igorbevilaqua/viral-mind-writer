import math, re, json
from base import *

rows = carregar()
for r in rows: r['lc'] = math.log10((r['coeficiente_viral'] or 0) + 0.01)
IG = [r for r in rows if r['plataforma'] == 'Instagram']
IGs = [r for r in IG if r['sim']]
RIG = [r for r in IG if r['ret_ok'] and r['queda'] is not None]; RIGs = [r for r in RIG if r['sim']]
TTs = [r for r in rows if r['plataforma'] == 'TikTok' and r['sim']]; RTTs = [r for r in TTs if r['ret_ok'] and r['queda'] is not None]

def g_sub(r): return ('H71' if r['retencao_hook'] >= 71 else 'H<71') + ('_q<=17' if r['queda'] <= 17 else '_q>17')
print('## Queda do subhook (hook ≥71 x queda ≤17)')
for nome, base, cut in [('IG_todos', RIG, 71), ('IG_sim', RIGs, 71), ('IG_nao', [r for r in RIG if not r['sim']], 71), ('TT_sim', RTTs, 68)]:
    exp = esperado(base); out = []
    for g in ['H71_q<=17', 'H71_q>17', 'H<71_q<=17', 'H<71_q>17']:
        def p(r, g=g): return (('H71' if r['retencao_hook'] >= cut else 'H<71') + ('_q<=17' if r['queda'] <= 17 else '_q>17')) == g
        xs = [r for r in base if p(r)]; la, _ = lift_aj(base, p, exp)
        ic = boot_lift(base, p) if len(xs) >= 15 and nome != 'TT_sim' else ('', '')
        out.append(f"{g}: {taxa(xs)*100:.1f}% n={len(xs)} aj {la:.2f}" + (f" IC90 {ic[0]:.2f}–{ic[1]:.2f}" if ic[0] != '' else ''))
    f, n, z = clientes_consist([r for r in base if r['retencao_hook'] >= cut], lambda r: r['queda'] <= 17, 5)
    print(nome, len(base), ' | '.join(out), f'| dentro de hook≥{cut}, clientes em que queda≤17 acerta mais: {f}/{n}/{z} (≥5 cada lado)')

M = ['historia', 'mecanismo', 'demonstracao', 'panorama']
print('\n## Por modo (IG sim)')
print('| modo | n IG | acerto % | lift aj modo | n ret | hook med | Δhook vs cli | queda med | Δqueda vs cli | %hook≥71 | acerto se hook≥71 & queda≤17 (n) | se hook≥71 & queda>17 (n) | n TT ret | queda med TT |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
expIG = esperado(IGs)
for m in M:
    xs = [r for r in IGs if r['modo'] == m]; rx = [r for r in RIGs if r['modo'] == m]
    la, _ = lift_aj(IGs, lambda r: r['modo'] == m, expIG)
    a = [r for r in rx if r['retencao_hook'] >= 71 and r['queda'] <= 17]; b = [r for r in rx if r['retencao_hook'] >= 71 and r['queda'] > 17]
    tt = [r for r in RTTs if r['modo'] == m]
    print(f"| {m} | {len(xs)} | {taxa(xs)*100:.1f} | {la:.2f} | {len(rx)} | {med([r['retencao_hook'] for r in rx])} | {delta_cli(RIGs,'retencao_hook',lambda r: r['modo']==m):+.1f} | {med([r['queda'] for r in rx])} | {delta_cli(RIGs,'queda',lambda r: r['modo']==m):+.1f} | {sum(r['retencao_hook']>=71 for r in rx)/len(rx)*100:.0f} | {taxa(a)*100:.0f} ({len(a)}) | {taxa(b)*100:.0f} ({len(b)}) | {len(tt)} | {med([r['queda'] for r in tt])} |")

# por cliente: queda de mecanismo vs média dos outros modos do mesmo cliente
print('\n## B1a: queda em mecanismo vs outros modos, dentro do mesmo cliente (IG sim, ret)')
por = C.defaultdict(list)
for r in RIGs:
    if r['modo'] in M: por[cli(r)].append(r)
dif = []
for c, xs in por.items():
    a = [r['queda'] for r in xs if r['modo'] == 'mecanismo']; b = [r['queda'] for r in xs if r['modo'] != 'mecanismo']
    if len(a) >= 5 and len(b) >= 5: dif.append((c, st.median(a) - st.median(b), len(a), len(b)))
print('clientes', len(dif), 'mecanismo cai mais em', sum(d[1] > 0 for d in dif), '| menos em', sum(d[1] < 0 for d in dif), '| igual', sum(d[1] == 0 for d in dif), '| mediana das diferenças', med([d[1] for d in dif]))
for d in sorted(dif, key=lambda d: d[1]): print('  ', d)

# B1b: o que vem depois do hook no roteiro do CRM
CONTEXTO = re.compile(r"^\W*(em (19|20)\d\d|no ano de|desde (19|20)\d\d|desde que|h[aá] (mais de )?\d+|h[aá] (uns |alguns |poucos )?(anos|meses|d[eé]cadas)|tudo come[cç]ou|a hist[oó]ria (come[cç]a|dessa|desse)|para (voc[eê] )?entender|pra (voc[eê] )?entender|antes de|primeiro,|basicamente|funciona assim|o que acontece [eé]|isso (acontece|aconteceu) porque|isso porque|a explica[cç][aã]o|explicando|vamos (l[aá]|entender)|deixa eu (te )?(explicar|contar)|olha s[oó]|veja bem|nos anos|na d[eé]cada|no in[ií]cio|no come[cç]o|quando (ele|ela|eles|a empresa)|fundad|criad[ao] em|nascid|[A-ZÁÉÍÓÚ][\wáéíóúâêôãõç]+( [A-ZÁÉÍÓÚ][\wáéíóúâêôãõç]+)* (é|era|foi) (uma|um|o|a) (empresa|marca|startup|rede|banco|fabricante|companhia|plataforma|programa|lei|empres[aá]rio|engenheiro|bilion[aá]rio|grupo|país|órgão|estatal)|(a|o) [\wáéíóúâêôãõç]+ (é|era|foi) (uma|um) (empresa|marca|startup|rede|banco|fabricante|companhia|plataforma|programa|lei|grupo|órgão|estatal))", re.I)
ANO = re.compile(r"\b(em|desde|no ano de|até) (19|20)\d\d\b", re.I)
APROF = re.compile(r"^\W*(e (o|a) (pior|mais|melhor|detalhe|segredo|motivo|culpa|curioso|absurdo|louco|engra[cç]ado)|e n[aã]o\b|e tem mais|e mais\b|mas (o|a) (pior|mais|detalhe|segredo)|s[oó] que|e isso (n[aã]o|[eé] s[oó])|e ele (n[aã]o|ainda|tamb[eé]m)|e ela (n[aã]o|ainda|tamb[eé]m)|e o (que|mais)|e (a|o) (resposta|explica)|sim,|e sim|pior:|detalhe:)", re.I)

def seguinte(r):
    s = r['seg']
    if not s: return None
    hw = set(re.findall(r"\w+", r['h'].lower()))
    for t in (s['subhook'], s['sub2']):
        w = re.findall(r"\w+", (t or '').lower())
        if not w: return None
        if sum(x in hw for x in w) / len(w) < 0.6: return t  # parágrafo que o hook falado ainda não cobriu
    return None

for r in rows:
    t = seguinte(r) if r.get('seg') else None
    r['seg_txt'] = t
    r['seg_ctx'] = None if t is None else bool(CONTEXTO.match(t) or ANO.search(re.split(r"(?<=[.!?])\s", t)[0]))
    r['seg_aprof'] = None if t is None else bool(APROF.match(t))

print('\n## B1b: parágrafo seguinte ao hook (roteiro do CRM) é contexto? (IG sim, ret)')
for m in M + ['todos']:
    rx = [r for r in RIGs if (r['modo'] == m or m == 'todos') and r['modo'] in M and r['seg_ctx'] is not None]
    for lab, p in [('contexto', lambda r: r['seg_ctx']), ('aprofunda', lambda r: r['seg_aprof'] and not r['seg_ctx']), ('outro', lambda r: not r['seg_ctx'] and not r['seg_aprof'])]:
        xs = [r for r in rx if p(r)]
        h71 = [r for r in xs if r['retencao_hook'] >= 71]
        print(f"  {m:13s} {lab:10s} n={len(xs):4d} queda med {med([r['queda'] for r in xs])} Δqueda vs cli {delta_cli(RIGs,'queda',lambda r,p=p,m=m: (r['modo']==m or m=='todos') and r['modo'] in M and r['seg_ctx'] is not None and p(r)):+.1f} | acerto {taxa(xs)*100:.0f}% | hook≥71: n={len(h71)} acerto {taxa(h71)*100:.0f}% %queda≤17 {sum(r['queda']<=17 for r in h71)/max(1,len(h71))*100:.0f}%")
    if m == 'mecanismo':
        f, n, z = clientes_consist(rx, lambda r: r['seg_ctx'], 4)
        print('   clientes (mecanismo) em que contexto acerta mais/neutro/menos (≥4 cada lado):', f, n, z)
# bootstrap por cliente da diferença de Δqueda contexto - não contexto, todos os modos
def dq(base):
    a = [r['queda'] for r in base if r['seg_ctx']]; b = [r['queda'] for r in base if not r['seg_ctx']]
    return (sum(a)/len(a) - sum(b)/len(b)) if a and b else float('nan')
for m in ['mecanismo', 'todos']:
    bb = [r for r in RIGs if (r['modo'] == m or m == 'todos') and r['modo'] in M and r['seg_ctx'] is not None]
    por = C.defaultdict(list)
    for r in bb: por[cli(r)].append(r)
    rnd = random.Random(3); cs = list(por); vals = []
    for _ in range(1000):
        b = [r for c in (rnd.choice(cs) for _ in cs) for r in por[c]]; vals.append(dq(b))
    vals = sorted(v for v in vals if v == v)
    print(f'  diferença média de queda (contexto − resto) {m}: {dq(bb):+.1f} pts, IC90 boot cliente {vals[50]:+.1f} a {vals[949]:+.1f}')
print('  exemplos contexto (mecanismo):')
for r in [r for r in RIGs if r['modo'] == 'mecanismo' and r['seg_ctx']][:8]: print('    -', r['retencao_hook'], '->', r['retencao_subhook'], '|', r['h'][:90], '||', r['seg_txt'][:110])

# B2 panorama: número na abertura vs país/marca agindo
print('\n## B2: abertura em panorama (e nos outros modos, para comparar)')
def ab(r):
    if r['abre_pais_ou_marca']: return 'pais/marca'
    if r['abre_numero'] or r['num_1a_frase']: return 'numero_1a_frase'
    return 'outro'
for m in M:
    xs = [r for r in IGs if r['modo'] == m]; rx = [r for r in RIGs if r['modo'] == m]
    out = []
    for g in ['pais/marca', 'numero_1a_frase', 'outro']:
        p = lambda r, g=g: ab(r) == g
        a = [r for r in xs if p(r)]; la, _ = lift_aj(xs, p, expIG)
        ra = [r for r in rx if p(r)]
        out.append(f"{g}: n={len(a)} acerto {taxa(a)*100:.0f}% aj {la:.2f} Δlogcoef {delta_cli(IGs,'lc',lambda r,p=p,m=m: r['modo']==m and p(r)):+.2f} | ret n={len(ra)} Δhook {delta_cli(RIGs,'retencao_hook',lambda r,p=p,m=m: r['modo']==m and p(r)):+.1f} Δqueda {delta_cli(RIGs,'queda',lambda r,p=p,m=m: r['modo']==m and p(r)):+.1f}")
    print(f"  {m}:\n    " + "\n    ".join(out))
    if m == 'panorama':
        f, n, z = clientes_consist([r for r in xs if ab(r) != 'outro'], lambda r: ab(r) == 'pais/marca', 3)
        print('    clientes em panorama em que pais/marca > número (≥3 cada lado):', f, n, z)
        p = lambda r: r['abre_numero']
        a = [r for r in xs if p(r)]; print('    abre literalmente com número (1º token):', len(a), f'acerto {taxa(a)*100:.0f}%')
        print('    exemplos numero_1a_frase:'); [print('     -', r['classificacao'], r['retencao_hook'], r['h'][:120]) for r in [r for r in xs if ab(r) == 'numero_1a_frase'][:6]]

# B3 história: nome conhecido / desconhecido / sem nome
STOP = set("""o a os as um uma uns umas e é esse essa este esta isso isto aquele aquela esses essas estes estas ele ela eles elas eu você voce vc nós nos mas só so quando se em no na nos nas de do da dos das por para pra com sem que qual quem como onde porque por que mais menos muito muita todo toda todos todas tudo nada ninguém alguém hoje ontem agora antigamente sim não nao já ja até ate depois antes enquanto imagina olha veja então entao aqui ali lá la seu sua seus suas meu minha nosso nossa há ha tem foi era vai pode existe essa sabe e,""".split())
LUGAR = re.compile(r"^(" + PAISES + r"|são paulo|rio( de janeiro)?|minas( gerais)?|bahia|cear[aá]|pernambuco|paran[aá]|goi[aá]s|amazonas|par[aá]|santa catarina|rio grande|nordeste|sul|norte|europa|[aá]sia|[aá]frica|am[eé]rica|ásia|pequim|xangai|nova york|londres|paris|tóquio|t[oó]quio|curitiba|recife|fortaleza|salvador|bras[ií]lia|belo horizonte|porto alegre|manaus|bel[eé]m|campinas|goiânia|florian[oó]polis|acre|alagoas|amap[aá]|esp[ií]rito santo|maranh[aã]o|mato grosso|para[ií]ba|piau[ií]|rond[oô]nia|roraima|sergipe|tocantins|distrito federal|joinville|uberl[aâ]ndia|ribeir[aã]o preto|santos|niter[oó]i|hong kong|singapura|cingapura|su[ií][cç]a|su[eé]cia|noruega|dinamarca|holanda|it[aá]lia|espanha|gr[eé]cia|turquia|egito|nig[eé]ria|chile|peru|col[oô]mbia|uruguai|paraguai|bol[ií]via|cuba|ucr[aâ]nia|taiwan|vietn[aã]|tail[aâ]ndia|indon[eé]sia|austr[aá]lia|ar[aá]bia|catar|emirados|vale do sil[ií]cio|silicon valley|ocidente|oriente)", re.I)
NAOENT = re.compile(r"^(ia|ias|r\$|us\$|pix|ceo|ti|ti\b|tv|eua|ue|onu|covid|natal|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|segunda|terça|quarta|quinta|sexta|sábado|domingo|deus|governo|internet)$", re.I)
CAP = re.compile(r"[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wáéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ'’&.-]*")
TOK = re.compile(r"[\wáéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ'’&$-]+|[.!?:]")
# palavra maiúscula no meio da frase em algum hook da base = nome próprio de verdade (vale também quando abre a frase)
MEIO = C.Counter()
for r in rows:
    ts = TOK.findall(r['h'])
    for i, t in enumerate(ts):
        if i > 0 and ts[i-1] not in '.!?:' and CAP.fullmatch(t): MEIO[t.lower()] += 1
def entidades(h):
    toks = TOK.findall(h)
    ents, cur, inicio = [], [], True
    for t in toks:
        if t in '.!?:':
            if cur: ents.append(' '.join(cur)); cur = []
            inicio = True; continue
        ok = CAP.fullmatch(t) and not NAOENT.match(t) and t.lower() not in STOP
        if ok and inicio and MEIO[t.lower()] < 2: ok = False
        if ok: cur.append(t)
        elif cur and t.lower() in ('de', 'da', 'do', 'dos', 'das'): cur.append(t)
        else:
            if cur: ents.append(' '.join(cur)); cur = []
        inicio = False
    if cur: ents.append(' '.join(cur))
    return [e for e in (re.sub(r"(\s+(de|da|do|dos|das))+$", '', e).strip(" '’") for e in ents) if e]

# frequência de cada entidade entre clientes (toda a base, todas as redes, sim + não)
ent_cli = C.defaultdict(set)
for r in rows:
    for e in set(entidades(r['h'])): ent_cli[e.lower()].add(cli(r))
FAM = re.compile(r"^(" + MARCAS + r")", re.I)
def nome_cat(r):
    es = [e for e in entidades(r['h']) if not LUGAR.match(e)]
    if not es: return 'so_lugar' if any(LUGAR.match(e) for e in entidades(r['h'])) else 'sem_nome'
    if any(FAM.match(e) or len(ent_cli[e.lower()]) >= 3 for e in es): return 'conhecido'
    return 'desconhecido'
for r in rows: r['nome_cat'] = nome_cat(r)
print('\n## B3: nome no hook, por modo (conhecido = em lista de marcas/famosos OU citado em hooks de ≥3 clientes)')
for m in M:
    xs = [r for r in IGs if r['modo'] == m]; rx = [r for r in RIGs if r['modo'] == m]
    print(f'  {m}:')
    for g in ['conhecido', 'desconhecido', 'so_lugar', 'sem_nome']:
        p = lambda r, g=g: r['nome_cat'] == g
        a = [r for r in xs if p(r)]; la, _ = lift_aj(xs, p, expIG); ra = [r for r in rx if p(r)]
        ic = boot_lift(xs, p) if len(a) >= 20 else (float('nan'),)*2
        print(f"    {g:12s} n={len(a):4d} acerto {taxa(a)*100:4.0f}% aj {la:.2f} IC90 {ic[0]:.2f}–{ic[1]:.2f} Δlogcoef {delta_cli(IGs,'lc',lambda r,p=p,m=m: r['modo']==m and p(r)):+.2f} | ret n={len(ra)} Δhook {delta_cli(RIGs,'retencao_hook',lambda r,p=p,m=m: r['modo']==m and p(r)):+.1f} Δqueda {delta_cli(RIGs,'queda',lambda r,p=p,m=m: r['modo']==m and p(r)):+.1f}")
    if m == 'historia':
        f, n, z = clientes_consist([r for r in xs if r['nome_cat'] in ('conhecido', 'desconhecido')], lambda r: r['nome_cat'] == 'conhecido', 4)
        print('    clientes em história em que conhecido > desconhecido (≥4 cada lado):', f, n, z)
        for g in ['conhecido', 'desconhecido']:
            print(f'    exemplos {g}:'); [print('      -', r['classificacao'], r['h'][:110], '| ents:', entidades(r['h'])) for r in [r for r in xs if r['nome_cat'] == g][:6]]
        p = lambda r: r['nome_revelacao']
        a = [r for r in xs if p(r)]; ra = [r for r in rx if p(r)]
        print(f"    nome como revelação em história: n={len(a)} acerto {taxa(a)*100:.0f}% | ret n={len(ra)} Δhook {delta_cli(RIGs,'retencao_hook',lambda r: r['modo']=='historia' and p(r)):+.1f} Δqueda {delta_cli(RIGs,'queda',lambda r: r['modo']=='historia' and p(r)):+.1f}")
        p = lambda r: r['imperio']
        a = [r for r in xs if p(r)]; la, _ = lift_aj(xs, p, expIG); print(f"    'império/fatura N bi' em história: n={len(a)} acerto {taxa(a)*100:.0f}% aj {la:.2f}")

# A x modo: sinal das features dentro de cada modo
print('\n## Features da parte A dentro de cada modo (IG sim, lift aj. com taxa do cliente; n)')
FE = ['acabou_de','abre_nome','combo_acabou_nome','conflito','guerra','pais_regiao','abre_esse','pergunta','primeira_pessoa','num_1a_frase','abre_pais_ou_marca','subhook_causal','nostalgia','imperio']
print('| feature | ' + ' | '.join(M) + ' |\n|---|' + '---|'*len(M))
for k in FE:
    cells = []
    for m in M:
        xs = [r for r in IGs if r['modo'] == m]; la, n = lift_aj(xs, lambda r, k=k: r[k], expIG)
        cells.append(f"{la:.2f} ({n})" if n >= 10 else f"({n})")
    print(f"| {k} | " + ' | '.join(cells) + ' |')
print('\nmecanismo: desafio_de_crenca com/sem nome')
xs = [r for r in IGs if r['modo'] == 'mecanismo' and r['cats'] is not None]
for lab, q in [('com nome/marca', lambda r: r['abre_nome'] or r['marca_grande'] or r['nome_cat']=='conhecido'), ('sem', lambda r: not (r['abre_nome'] or r['marca_grande'] or r['nome_cat']=='conhecido'))]:
    p = lambda r, q=q: 'desafio_de_crenca' in r['cats'] and q(r)
    a = [r for r in xs if p(r)]; la, _ = lift_aj(xs, p, expIG); print(f"  {lab}: n={len(a)} acerto {taxa(a)*100:.0f}% aj {la:.2f}")

# exporta a base analisada (sem segredo): 1 linha por vídeo IG/TT sim com modo
out = [{k: r[k] for k in ['video_id','cliente_nome','plataforma','data_publicacao','h','retencao_hook','retencao_subhook','queda','classificacao','coeficiente_viral','modo','ancora','nome_cat','seg_ctx','seg_aprof','abre_pais_ou_marca','num_1a_frase','abre_numero']} for r in rows if r['sim'] and r['plataforma'] in ('Instagram','TikTok')]
json.dump(out, open(D/'base_refiltro.json','w'), ensure_ascii=False, default=str)
print('\nexportado', len(out))
