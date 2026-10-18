# Base comum do refiltro: carrega o export (SELECT) e marca features com as regex do estudo de hooks.
import json, re, random, statistics as st, collections as C
from pathlib import Path

D = Path(__file__).parent
SEG = Path('/private/tmp/claude-501/-Users-igorbevilaqua-Projetos-Codex/0b6dec9f-ab27-43da-bd53-ed1e4352ddf1/scratchpad/estudo/data/segmentos.json')
MODOS = Path('/Users/igorbevilaqua/Projetos/CODEX - skills-modo/docs/estudo-modos-2026-10/dados/rotulos_modo.jsonl')

NICHO = {
 'IA/Tec': ['Izabela Anholett','Leonardo Cirino','João Felipe Marques','Manoel Victor','Patrick Diorio','Mariana Moreno','Thiago Bisewski'],
 'Finanças': ['Dilson Peres','Ricardo Schumacher','Fernando Pereira','Lerry Granville','Túlio Lichenstein'],
 'Sociedade/Geo': ['Lincoln Fracari','Café com Ferri','Igor Bevilaqua'],
 'Ciência/Inov': ['Rafael Rodrigues','Marcio Grazino','Leonardo Martins','Leonardo Nogueira','Drielle Castelani'],
 'Case/Empresa': ['Franklin Tomich','Rodrigo Waughan','João Paulo Albuquerque','Renato Torres','Renato Mendes'],
 'Empreend/Mkt': ['Marcos Pelozato','Marcelo Germano','Thiago Franco','Cadu Neiva','Pedro Elero','Thainá Iansen'],
}
NICHO_DE = {c: n for n, cs in NICHO.items() for c in cs}

def low(h): return h.lower()
R = lambda p: re.compile(p, re.I)

MARCAS = r"apple|iphone|samsung|google|toyota|byd|nike|adidas|coca|pepsi|tesla|meta\b|chatgpt|openai|nestl|mercado livre|honda|volvo|geely|amazon|microsoft|netflix|mcdonald|mc donald|uber|ifood|nubank|itaú|itau|bradesco|ambev|natura|havan|magalu|magazine luiza|shopee|shein|temu|red bull|hershey|ferrari|porsche|bmw|mercedes|volkswagen|fiat|chevrolet|ford|hyundai|disney|spotify|youtube|instagram|whatsapp|facebook|tiktok|zara|starbucks|burger king|kopenhagen|cacau show|boticário|boticario|petrobras|vale\b|embraer|walmart|carrefour|ikea|lego|sony|nintendo|playstation|xbox|nvidia|intel|huawei|xiaomi|alibaba|deepseek|elon musk|musk|trump|zuckerberg|bezos|lula|bolsonaro|neymar|messi|silvio santos|palmeiras|flamengo|corinthians|real madrid|barcelona|copa do mundo|fifa"
PAISES = r"china|chin[eê]s|chinesa|brasil|brasileir|nordeste|jap[aã]o|japon[eê]s|eua\b|estados unidos|americano|americana|índia|india\b|rússia|russia|ir[aã]\b|israel|coreia|alemanha|fran[çc]a|argentina|portugal|europa|dubai|méxico|mexico|venezuela|canad[aá]|inglaterra|reino unido"

F = {
 # regex dos .md (hooks_2 §4, hooks_4 §3c/§6, hooks_5 §0)
 'acabou_de': R(r"\bacab(ou|a) de\b"),
 'conflito': R(r"guerra|humilh|destru|matou|p[aâ]nico|mentindo|vergonha|assustador|golpe"),
 'pergunta': R(r"\?"),
 'primeira_pessoa': R(r"\b(eu|meu|minha|meus|minhas)\b"),
 'abre_1a_pessoa': R(r"^\W*(eu|meu|minha|meus|minhas|hoje eu)\b"),
 'abre_esse': R(r"^\W*(esse|essa|este|esta)\b"),
 'abre_voce': R(r"^\W*(você|voce|vc)\b"),
 'pais_regiao': R(r"china|brasil|nordeste|jap[aã]o|\beua\b|estados unidos"),
 'numero': R(r"\d"),
 'ninguem_sabe': R(r"quase ningu[eé]m|ningu[eé]m sabe|voc[eê] nunca"),
 'nostalgia': R(r"antigamente|lembra|sumiu"),
 'guerra': R(r"declar\w* guerra|em guerra"),
 'promessa_vazia': R(r"do que (parece|(voc[eê] )?(imagina|pensa))"),
 'subhook_causal': R(r"a culpa (é|e|foi|está|tá)|o motivo|o segredo|(e|,) o pior\b|a culpada|o culpado"),
 'lista_numerada': R(r"\b(\d+|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez)\s+(dicas|erros|passos|formas|maneiras|motivos|raz[oõ]es|coisas|segredos|h[aá]bitos|regras|sinais|estrat[eé]gias|li[cç][oõ]es|perguntas|ferramentas)\b"),
 'acusar_espectador': R(r"o problema (é|e|são|sao) (voc[eê]|vc)|(voc[eê]|vc) (é|e) o problema|a culpa (é|e) (sua|do seu|da sua|de voc[eê])|o problema (é|e|está|esta|tá|ta) (no seu|na sua|em voc[eê])|(o problema|o mercado) n[aã]o (é|e) o problema\W+(é )?(voc[eê]|vc)|n[aã]o (é|e) o problema\. (voc[eê]|vc)"),
 'imagina': R(r"^\W*imagin(a|e)\b"),
 'contexto_serie': R(r"(primeiro|segundo|terceiro|quarto|quinto|[uú]ltimo|novo) (v[ií]deo|epis[oó]dio|ep\.?) (da|de|dessa|desta) s[eé]rie|\bda s[eé]rie\b|\bdia (um|dois|tr[eê]s|\d+)\b.{0,15}\b(no|na|do|da|de)\b|epis[oó]dio \d|\bparte (\d|um|dois|tr[eê]s)\b|nesse quadro|neste quadro|no quadro"),
 'se_voce': R(r"^\W*se (voc[eê]|vc)\b"),
 'nome_revelacao': R(r"o nome (dele|dela|desse|dessa|deste|desta|do|da)?\s*(é|e)\b|tem nome|(ele|ela|que) se chama|se chama\b"),
 'imperio': R(r"imp[eé]rio|fatur\w*\s+(mais de\s+)?(r\$\s*)?[\d,.]+\s*(bi|mi|bilh|milh)|virou um neg[oó]cio de|de (zero|nada|camel[oô])\b.{0,40}\b(a|para|pra)\b"),
 'choque': R(r"assustador|humilh|pesadelo|mentindo|p[aâ]nico|fatal|revolt|chocou|chocante|absurd|insan"),
 'marca_grande': R(MARCAS),
}

ABRE_NOME = re.compile(r"^\W*(O|A|Os|As)\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]")
DAVI_G = R(r"gigante|multinacional|maiores empresas|bilion[aá]ri|" + MARCAS)
DAVI_P = R(r"pequen|jovem|garot|menin|estudante|cearense|nordestin|nordeste|interior|cidadezinha|fam[ií]lia|av[oó]\b|fundo de quintal|desconhecid|startup|brasileir|baiano|mineir|ga[uú]cho|paraense|pernambucan|goian|paraiban|potiguar|capixaba|amazonense|uma lojinha|garagem")
DAVI_V = R(r"venc|derrot|humilh|super(a|ou)|n[aã]o consegue|copi|perde|perdeu|amea[çc]|tirando o sono|tira o sono|assust|incomod|desbanc|concorrente|enfrent|bate\b|bateu|passou na frente|passa na frente|engoliu|domina\w*.{0,40}\bmenos\b|menos (um|uma)")

PRIMEIRA_FRASE = re.compile(r"^(.+?[.!?])(\s|$)", re.S)
NUM_TOK = R(r"\d|\bmil\b|milh[aã]o|milh[oõ]es|bilh[aã]o|bilh[oõ]es|trilh|por cento|%|\bum terço|\bmetade\b|\bdobro\b")
ABRE_NUM = R(r"^\W*(r\$|us\$|\$|\d|(um|uma|dois|duas|tr[eê]s|quatro|cinco|dez|cem|mil)\s+(mil|milh|bilh|trilh|anos|dias|meses|em cada|por cento)|mil\b|milh|bilh|trilh|\d+%|metade|o dobro)")
ABRE_PAIS = R(r"^\W*((o|a|os)\s+)?(" + PAISES + r")\b")
ABRE_MARCA = R(r"^\W*((o|a|os|as)\s+)?(" + MARCAS + r")")

def features(h):
    l = low(h)
    out = {k: bool(rx.search(h)) for k, rx in F.items()}
    out['abre_nome'] = bool(ABRE_NOME.match(h))
    out['combo_acabou_nome'] = out['acabou_de'] and out['abre_nome']
    out['davi_golias'] = bool(DAVI_G.search(l) and DAVI_P.search(l) and DAVI_V.search(l))
    m = PRIMEIRA_FRASE.match(h.strip()); f1 = m.group(1) if m else h
    out['num_1a_frase'] = bool(NUM_TOK.search(f1))
    out['abre_numero'] = bool(ABRE_NUM.match(h))
    out['abre_pais'] = bool(ABRE_PAIS.match(h))
    out['abre_marca'] = bool(ABRE_MARCA.match(h))
    out['abre_pais_ou_marca'] = out['abre_pais'] or out['abre_marca'] or out['abre_nome']
    out['palavras'] = len(h.split())
    return out

def carregar():
    fv = json.load(open(D/'fv.json')); vd = {v['id']: v for v in json.load(open(D/'videos.json'))}
    sent = {s['video_id']: s['sentimentos'] for s in json.load(open(D/'sent.json'))}
    pb = {}
    for p in json.load(open(D/'pb.json')):
        if p['dimensao'] == 'hook': pb[p['chave']] = p['categorias'] or []
    modo = {}
    for l in open(MODOS):
        r = json.loads(l); modo[r['script_id']] = r
    seg = {s['script_id']: s for s in json.load(open(SEG))}
    rows = []
    for f in fv:
        v = vd.get(f['video_id'])
        if not v or f['maturando'] or v['removido'] or v['is_repost'] or not (f['hook'] or '').strip(): continue
        if not f['classificacao']: continue
        r = dict(f); h = f['hook'].strip()
        r['h'] = h; r.update(features(h))
        r['acerto'] = f['classificacao'] == 'acerto'
        r['crm'] = v['crm_script_id']
        r['sim'] = f['vm_script'] == 'sim'
        cats = pb.get(f['hook'])
        r['cats'] = cats
        mr = modo.get(v['crm_script_id']) if v['crm_script_id'] else None
        r['modo'] = mr['modo'] if mr else None
        r['ancora'] = mr['ancora'] if mr else None
        r['seg'] = seg.get(v['crm_script_id']) if v['crm_script_id'] else None
        s = sent.get(f['video_id']) or []
        r['sent12'] = set()
        for x in s:
            try:
                j = json.loads(x) if isinstance(x, str) else x
                if j.get('rank') in (1, 2): r['sent12'].add(j['sentimento'])
            except Exception: pass
        r['nicho'] = NICHO_DE.get(f['cliente_nome'])
        rh, rs = f['retencao_hook'], f['retencao_subhook']
        r['ret_ok'] = bool(rh and rh > 0 and f['cliente_nome'] and not (f['plataforma'] == 'Instagram' and f['cliente_nome'] == 'Rodrigo Waughan'))
        r['queda'] = (rh - rs) if (r['ret_ok'] and rs is not None) else None
        rows.append(r)
    return rows

def cli(r): return r['cliente_nome'] or ('canal:' + str(r['cliente_id']))

def taxa(xs): return sum(r['acerto'] for r in xs) / len(xs) if xs else float('nan')

def esperado(base):
    t = C.defaultdict(lambda: [0, 0])
    for r in base: t[cli(r)][0] += r['acerto']; t[cli(r)][1] += 1
    return {c: a / n for c, (a, n) in t.items()}

def lift_aj(base, pred, exp=None):
    exp = exp or esperado(base)
    xs = [r for r in base if pred(r)]
    e = sum(exp[cli(r)] for r in xs)
    return (sum(r['acerto'] for r in xs) / e if e else float('nan')), len(xs)

def boot_lift(base, pred, reps=500, seed=1):
    # bootstrap por cliente (reamostra clientes inteiros); devolve IC 90%
    rnd = random.Random(seed); por = C.defaultdict(list)
    for r in base: por[cli(r)].append(r)
    cs = list(por); vals = []
    for _ in range(reps):
        b = [r for c in (rnd.choice(cs) for _ in cs) for r in por[c]]
        l, n = lift_aj(b, pred)
        if n and l == l: vals.append(l)
    vals.sort()
    if not vals: return (float('nan'), float('nan'))
    return (vals[int(.05 * len(vals))], vals[int(.95 * len(vals)) - 1])

def clientes_consist(base, pred, minn=8):
    por = C.defaultdict(list)
    for r in base: por[cli(r)].append(r)
    f = n = z = 0
    for c, xs in por.items():
        a = [r for r in xs if pred(r)]; b = [r for r in xs if not pred(r)]
        if len(a) < minn or len(b) < minn: continue
        ta, tb = taxa(a), taxa(b)
        if tb == 0: l = 2 if ta > 0 else 1
        else: l = ta / tb
        if l > 1.1: f += 1
        elif l < 0.9: z += 1
        else: n += 1
    return f, n, z

def med(xs):
    xs = [x for x in xs if x is not None]
    return st.median(xs) if xs else float('nan')

def delta_cli(base, campo, pred):
    # mediana da diferença (valor - mediana do cliente) nos vídeos com a feature
    m = C.defaultdict(list)
    for r in base:
        if r.get(campo) is not None: m[cli(r)].append(r[campo])
    mc = {c: st.median(v) for c, v in m.items()}
    return med([r[campo] - mc[cli(r)] for r in base if pred(r) and r.get(campo) is not None])
