// Plano 025: o perfil do cliente é texto que o time lê e edita (vm_client_preferences.perfil).
// Montado de fontes medidas: o modo que rende dentro dele (estudo de modos), o hook que rende nele
// e no nicho (estudo de hooks, refiltrado só para roteiro da casa), a síntese do estudo de outubro
// e o que o time corrigiu nos roteiros dele. Puro e sem LLM, para ser testado sem banco.
type ModoCliente = { fatia: number; videos: number; lift: number | null; lb: number | null; ub: number | null };

const NOME: Record<string, string> = { historia: "história", mecanismo: "mecanismo", demonstracao: "demonstração", panorama: "panorama", conselho: "conselho", publi: "publi" };
const x = (n: number) => `${n.toFixed(2).replace(".", ",")}x`;

export const slugCliente = (nome: string) =>
  nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/\s+/g, "-");

export function leituraDoModo(m: ModoCliente): string {
  if (m.lift == null || m.lb == null || m.ub == null) return "poucos vídeos para medir";
  if (m.lb > 1) return `rende ${x(m.lift)} a média do cliente (diferença significativa): vale escrever mais neste modo`;
  if (m.ub < 1) return `rende ${x(m.lift)} a média do cliente (diferença significativa): evite como padrão`;
  return `rende ${x(m.lift)} a média do cliente (sem diferença clara)`;
}

export function montarPerfil(e: {
  nome: string;
  roteiros: number;
  modos: Record<string, ModoCliente>;
  hook?: { roteiros: number; linhas: string[] };
  sintese: string;
  licoes: { titulo: string; descricao: string }[];
}): string {
  const partes: string[] = [];
  const modos = Object.entries(e.modos).filter(([, m]) => m.fatia > 0).sort((a, b) => b[1].fatia - a[1].fatia);
  if (modos.length)
    partes.push(
      `## Modos (estudo de modos, out/2026, ${e.roteiros} roteiros)\n` +
        modos.map(([k, m]) => `- ${NOME[k] ?? k}: ${Math.round(m.fatia * 100)}% dos roteiros, ${leituraDoModo(m)}`).join("\n")
    );
  if (e.hook?.linhas.length)
    partes.push(`## Hook (estudo de hooks, out/2026, só roteiro da casa no Instagram, ${e.hook.roteiros} do canal)\n${e.hook.linhas.join("\n")}`);
  if (e.sintese.trim()) partes.push(`## O que funciona no canal (estudo de outubro)\n${e.sintese.trim()}`);
  if (e.licoes.length) partes.push(`## O que o time corrigiu nos roteiros do canal\n${e.licoes.map((l) => `- ${l.titulo}: ${l.descricao}`).join("\n")}`);
  // O perfil entra no prompt: a regra da casa (sem travessão nem ponto e vírgula) vale também
  // para o que vem copiado do estudo.
  return partes.join("\n\n").replace(/\s*[—–]\s*/g, ", ").replace(/;/g, ",");
}

// ---------- Hook por cliente e por nicho ----------
// As regex do estudo (docs/estudo-hooks-2026-10/dados/refiltro_src/base.py), com fronteira de
// palavra que entende acento: o \b do JS não vê "ê" como letra.
const B = "(?<![\\p{L}\\p{N}_])";
const E = "(?![\\p{L}\\p{N}_])";
const rx = (s: string, f = "iu") => new RegExp(s.replaceAll("\\b<", B).replaceAll("\\b>", E), f);

export const TIPOS_HOOK: Record<string, { rotulo: string; rx: RegExp }> = {
  acabou_de: { rotulo: 'abrir com notícia de agora ("acabou de")', rx: rx("\\b<acab(ou|a) de\\b>") },
  abre_nome: { rotulo: 'abrir com marca ou pessoa conhecida ("O/A + Nome")', rx: rx("^\\W*(O|A|Os|As)\\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]", "u") },
  conflito: { rotulo: "conflito nomeado (guerra, humilhou, pânico, golpe)", rx: rx("guerra|humilh|destru|matou|p[aâ]nico|mentindo|vergonha|assustador|golpe") },
  pais_regiao: { rotulo: "país ou região no hook (China, Brasil, EUA)", rx: rx("china|brasil|nordeste|jap[aã]o|\\b<eua\\b>|estados unidos") },
  abre_esse: { rotulo: 'abrir com "Esse/Essa + objeto"', rx: rx("^[^\\p{L}\\p{N}]*(esse|essa|este|esta)\\b>") },
  pergunta: { rotulo: "pergunta no hook", rx: /\?/ },
  abre_voce: { rotulo: 'abrir com "Você"', rx: rx("^[^\\p{L}\\p{N}]*(você|voce|vc)\\b>") },
  primeira_pessoa: { rotulo: "primeira pessoa (eu, meu, minha)", rx: rx("\\b<(eu|meu|minha|meus|minhas)\\b>") },
  ninguem_sabe: { rotulo: '"quase ninguém sabe"', rx: rx("quase ningu[eé]m|ningu[eé]m sabe|voc[eê] nunca") },
  nostalgia: { rotulo: 'nostalgia de marca ("antigamente", "lembra", "sumiu")', rx: rx("antigamente|lembra|sumiu") },
  imperio: {
    rotulo: '"de X a império que fatura N bi"',
    rx: rx("imp[eé]rio|fatur[\\p{L}]*\\s+(mais de\\s+)?(r\\$\\s*)?[\\d,.]+\\s*(bi|mi|bilh|milh)|virou um neg[oó]cio de|de (zero|nada|camel[oô])\\b>.{0,40}\\b<(a|para|pra)\\b>"),
  },
};

// Agrupamento à mão do estudo (hooks_5 §0), o mesmo do refiltro.
export const NICHO_DO_CLIENTE: Record<string, string> = Object.fromEntries(
  Object.entries({
    "IA/Tecnologia": ["Izabela Anholett", "Leonardo Cirino", "João Felipe Marques", "Manoel Victor", "Patrick Diorio", "Mariana Moreno", "Thiago Bisewski"],
    "Finanças/Impostos": ["Dilson Peres", "Ricardo Schumacher", "Fernando Pereira", "Lerry Granville", "Túlio Lichenstein"],
    "Sociedade/Geopolítica": ["Lincoln Fracari", "Café com Ferri", "Igor Bevilaqua"],
    "Ciência/Inovação": ["Rafael Rodrigues", "Marcio Grazino", "Leonardo Martins", "Leonardo Nogueira", "Drielle Castelani"],
    "Case/História de empresa": ["Franklin Tomich", "Rodrigo Waughan", "João Paulo Albuquerque", "Renato Torres", "Renato Mendes"],
    "Empreendedorismo/Marketing": ["Marcos Pelozato", "Marcelo Germano", "Thiago Franco", "Cadu Neiva", "Pedro Elero", "Thainá Iansen"],
  }).flatMap(([n, cs]) => cs.map((c) => [c, n]))
);

// Playbook por nicho (hooks_5 §3): não deu para refiltrar (o playbook não está na base do
// refiltro), então entra marcado como sinal fraco.
const PLAYBOOK_NICHO: Record<string, string> = {
  "Finanças/Impostos": "o público de dinheiro desconfia de superlativo, de segredo revelado e de urgência no hook",
  "Ciência/Inovação": "o público de ciência quer a descoberta, não o medo: hook de viés de negatividade cai",
};

const DO_CLIENTE = ["imperio", "nostalgia"];

export type VideoHook = { cliente_nome: string | null; plataforma: string; h: string; classificacao: string };
type Medida = { com: number; sem: number; taxaCom: number; taxaSem: number; acCom: number };

const pct = (t: number) => `${Math.round(t * 100)}%`;
const medir = (vs: VideoHook[], tipo: string): Medida => {
  const com = vs.filter((v) => TIPOS_HOOK[tipo].rx.test(v.h));
  const sem = vs.filter((v) => !TIPOS_HOOK[tipo].rx.test(v.h));
  const ac = (xs: VideoHook[]) => xs.filter((v) => v.classificacao === "acerto").length;
  return { com: com.length, sem: sem.length, acCom: ac(com), taxaCom: com.length ? ac(com) / com.length : 0, taxaSem: sem.length ? ac(sem) / sem.length : 0 };
};

// ponytail: corte fixo (>=10 de cada lado, lift 1,3 e 0,75, como o hooks_5 §2) em vez de IC;
// com n de 10 a 30 por cliente o IC quase sempre cruza 1. Trocar por bootstrap se o time quiser régua fina.
const funciona = (m: Medida) => m.com >= 10 && m.sem >= 10 && m.acCom >= 3 && (m.taxaSem === 0 || m.taxaCom / m.taxaSem >= 1.3);
const falha = (m: Medida) => m.com >= 10 && m.sem >= 10 && m.com * m.taxaSem >= 2 && m.taxaCom / m.taxaSem <= 0.75;

/** Lê da tabela do hooks_5 §2 o melhor e o pior tipo de cada cliente (estudo com cortes de podcast). */
export function lerEstudoCortes(md: string): Record<string, { melhor?: string; pior?: string }> {
  const sec = md.split(/^## 2\./m)[1]?.split(/^#{2,3} /m)[0] ?? "";
  const out: Record<string, { melhor?: string; pior?: string }> = {};
  const tipo = (t: string) => (t === "jornada" ? "imperio" : t);
  for (const l of sec.split("\n")) {
    const m = l.match(/^\| \*\*(.+?)\*\* \([^)]*\) \| (\w+) \(([^)]*)\)[^|]*\|[^|]*\| (\w+) \(/);
    if (!m) continue;
    const lift = Number((m[3].split(", ")[2] ?? "0").replace(",", "."));
    const e: { melhor?: string; pior?: string } = {};
    if (lift > 1.1 && TIPOS_HOOK[tipo(m[2])]) e.melhor = tipo(m[2]);
    if (TIPOS_HOOK[tipo(m[4])]) e.pior = tipo(m[4]);
    out[m[1]] = e;
  }
  return out;
}

/**
 * Linhas de hook do perfil, medidas só no roteiro da casa (IG, vm_script='sim'). O estudo com
 * cortes de podcast (hooks_5 §2) só entra para avisar quando o que ele dizia não se repete aqui.
 */
export function linhasDeHook(
  videos: VideoHook[],
  cliente: string,
  nichos: Record<string, string>,
  cortes: { melhor?: string; pior?: string } | undefined
): string[] {
  const ig = videos.filter((v) => v.plataforma === "Instagram");
  const dele = ig.filter((v) => v.cliente_nome === cliente);
  const linhas: string[] = [];
  const ditos = new Set<string>();
  const fala = (m: Medida) => `acerta ${pct(m.taxaCom)} contra ${pct(m.taxaSem)} no resto do canal (${m.com} roteiros)`;
  const medivel = (m: Medida) => m.com >= 10 && m.sem >= 10;

  const medidas = Object.keys(TIPOS_HOOK).map((t) => [t, medir(dele, t)] as const);
  const razao = (m: Medida) => (m.taxaSem ? m.taxaCom / m.taxaSem : 99);
  for (const [t, m] of medidas.filter(([, m]) => funciona(m)).sort((a, b) => razao(b[1]) - razao(a[1])).slice(0, 3)) {
    linhas.push(`- Funciona no canal: ${TIPOS_HOOK[t].rotulo}: ${fala(m)}${cortes?.melhor === t ? ", e já era o melhor no estudo com cortes" : ""}`);
    ditos.add(t);
  }
  for (const [t, m] of medidas.filter(([, m]) => falha(m)).sort((a, b) => razao(a[1]) - razao(b[1])).slice(0, 3)) {
    linhas.push(`- Evite no canal: ${TIPOS_HOOK[t].rotulo}: ${fala(m)}${cortes?.pior === t ? ", e já era o pior no estudo com cortes" : ""}`);
    ditos.add(t);
  }
  // O que o estudo com cortes dizia e o roteiro não repete vira sinal fraco. O que nem aparece no
  // roteiro da casa fica de fora: era coisa de corte de podcast (REFILTRO §1a).
  for (const [qual, t] of [["melhor", cortes?.melhor], ["pior", cortes?.pior]] as const) {
    if (!t || ditos.has(t) || !medivel(medir(dele, t))) continue;
    linhas.push(`- Sinal fraco: ${TIPOS_HOOK[t].rotulo} era o ${qual} tipo do canal no estudo que misturava cortes de podcast, e no roteiro da casa ${fala(medir(dele, t))}`);
    ditos.add(t);
  }
  // Decisão 5: império e nostalgia dependem do cliente, então aparecem mesmo perto do neutro.
  for (const t of DO_CLIENTE) {
    const m = medir(dele, t);
    if (ditos.has(t) || !medivel(m)) continue;
    linhas.push(`- Sinal fraco: ${TIPOS_HOOK[t].rotulo}: ${fala(m)}`);
    ditos.add(t);
  }

  // Nicho: lift ajustado pela taxa de cada cliente, para um cliente grande não falar pelo nicho.
  const nicho = nichos[cliente];
  if (nicho) {
    const doNicho = ig.filter((v) => v.cliente_nome && nichos[v.cliente_nome] === nicho);
    const base = new Map<string, number>();
    for (const c of new Set(doNicho.map((v) => v.cliente_nome as string))) {
      const vs = doNicho.filter((v) => v.cliente_nome === c);
      base.set(c, vs.filter((v) => v.classificacao === "acerto").length / vs.length);
    }
    const bom: string[] = [];
    const ruim: string[] = [];
    const fraco: string[] = [];
    for (const t of Object.keys(TIPOS_HOOK)) {
      if (ditos.has(t)) continue;
      const com = doNicho.filter((v) => TIPOS_HOOK[t].rx.test(v.h));
      const esperado = com.reduce((s, v) => s + (base.get(v.cliente_nome as string) ?? 0), 0);
      if (com.length < 15 || esperado < 2) continue;
      const lift = com.filter((v) => v.classificacao === "acerto").length / esperado;
      const txt = `${TIPOS_HOOK[t].rotulo} (${x(lift)} o esperado, ${com.length} roteiros)`;
      if (lift >= 1.3) bom.push(txt);
      else if (lift <= 0.75) ruim.push(txt);
      else if (DO_CLIENTE.includes(t)) fraco.push(txt);
    }
    if (bom.length) linhas.push(`- No nicho ${nicho}, funciona: ${bom.join(", ")}`);
    if (ruim.length) linhas.push(`- No nicho ${nicho}, evite: ${ruim.join(", ")}`);
    if (fraco.length) linhas.push(`- Sinal fraco no nicho ${nicho}, perto do neutro: ${fraco.join(", ")}`);
    if (PLAYBOOK_NICHO[nicho]) linhas.push(`- Sinal fraco do nicho (estudo com cortes, não conferido só no roteiro da casa): ${PLAYBOOK_NICHO[nicho]}`);
  }
  return linhas;
}
