// Catálogo de marcas de hook do estudo de hooks (docs/estudo-2026-10/src/hooks/feat.mjs), portado
// sem mudar regex: o preditor v0 aprendeu os pesos das features hk_* com estas definições, e uma
// regex diferente aqui muda a nota em silêncio. Mudou lá, copia de novo para cá.
// PROPRIOS é o dicionário de nomes próprios que o estudo tira de segmentos.json (2.688 palavras),
// congelado em proprios.json porque a produção não tem o acervo do estudo.
import PROPRIOS_LISTA from "./proprios.json";

// ---------- texto (docs/estudo-2026-10/src/lib.mjs) ----------
const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9%$ ]/g, " ").replace(/\s+/g, " ").trim();
const palavras = (s: string | null | undefined) => ((s ?? "").match(/[\p{L}\p{N}]+(?:[.,][\p{N}]+)?/gu) ?? []).length;
const frases = (s: string | null | undefined) => (s ?? "").split(/(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ"“0-9])/u).map((x) => x.trim()).filter(Boolean);

// ---------- listas (normalizadas) ----------
const PESSOA = "cara|homem|homens|mulher|mulheres|menino|menina|meninos|meninas|garoto|garota|garotos|jovem|jovens|rapaz|moca|senhor|senhora|senhorinha|idoso|idosa|idosos|velhinho|velhinha|crianca|criancas|bebe|pai|mae|familia|casal|irmaos|irmao|irma|irmas|amigos|amigo|amigas|estudante|estudantes|aluno|alunos|aluna|alunas|professor|professora|cientista|cientistas|pesquisador|pesquisadores|pesquisadora|pesquisadoras|medico|medica|medicos|engenheiro|engenheira|engenheiros|empresario|empresaria|empresarios|empreendedor|empreendedora|empreendedores|bilionario|bilionaria|milionario|milionaria|brasileiro|brasileira|brasileiros|brasileiras|chines|chinesa|chineses|americano|americana|japones|japonesa|agricultor|agricultores|fazendeiro|produtor|produtores|pescador|motorista|taxista|caminhoneiro|entregador|vendedor|vendedora|ambulante|cozinheiro|chef|padeiro|mecanico|pedreiro|faxineira|gari|policial|soldado|atleta|jogador|jogadora|influenciador|influenciadora|youtuber|ator|atriz|cantor|cantora|artista|inventor|inventora|programador|hacker|advogado|advogada|juiz|juiza|deputado|deputada|politico|prefeito|presidente|ceo|dono|dona|donos|fundador|fundadora|funcionario|funcionaria|trabalhador|trabalhadora|trabalhadores|operario|cliente|garcom|pastor|padre|monge|indigena|ribeirinho|nordestino|nordestina|gaucho|mineiro|baiano|paulista|carioca|cearense|paraense|catarinense|paranaense|aposentado|aposentada|dentista|veterinario|farmaceutico|nutricionista|personal|piloto|surfista|lutador|treinador|tecnico|vovo|avo|tio|tia|filho|filha|filhos|herdeiro|herdeira|socios|socio|executivo|executiva|economista|investidor|investidores|golpista|ladrao|criminoso|bandido|preso|detento|imigrante|refugiado|morador|moradores|vizinho|vizinhos|mendigo|catador|cientistas";
const PAIS_EST = "china|chines|chinesa|chineses|chinesas|estados unidos|eua|americano|americana|americanos|americanas|japao|japones|japonesa|japoneses|russia|russo|russa|russos|india|indiano|indiana|indianos|coreia|coreano|coreana|coreanos|alemanha|alemao|alema|alemaes|argentina|argentino|argentinos|israel|israelense|irao|iraniano|iranianos|dubai|arabia saudita|emirados|inglaterra|reino unido|londres|britanico|italia|italiano|italiana|espanha|espanhol|portugal|mexico|mexicano|canada|australia|suica|suico|suecia|noruega|dinamarca|holanda|finlandia|singapura|taiwan|vietna|africa|nigeria|egito|turquia|ucrania|venezuela|cuba|chile|colombia|paraguai|uruguai|bolivia|europa|europeu|europeia|europeus|asia|asiatico|nova york|california|vale do silicio|hollywood|toquio|pequim|xangai|shenzhen|wall street|casa branca|pentagono|nasa|onu|otan|america latina|latino americano";
const REGIAO_BR = "nordeste|nordestino|nordestina|nordestinos|sudeste|centro oeste|interior|sertao|sao paulo|paulista|paulistano|rio de janeiro|carioca|minas gerais|mineiro|mineira|bahia|baiano|baiana|ceara|cearense|parana|paranaense|santa catarina|catarinense|maranhao|maranhense|pernambuco|pernambucano|amazonas|amazonia|amazonico|goias|goiano|mato grosso|piaui|piauiense|paraiba|paraibano|alagoas|alagoano|sergipe|espirito santo|capixaba|rio grande do sul|gaucho|gaucha|rio grande do norte|potiguar|tocantins|rondonia|roraima|amapa|brasilia|recife|fortaleza|curitiba|porto alegre|belo horizonte|manaus|belem|goiania|florianopolis|campinas|juazeiro|blumenau|joinville|ribeirao preto|uberlandia|joao pessoa|maceio|teresina|sao luis|cuiaba|campo grande|aracaju|macapa|porto velho|rio branco|zona franca|pantanal|caatinga|cerrado";
const BIGTECH = "apple|iphone|google|amazon|microsoft|facebook|instagram|whatsapp|meta|nvidia|openai|chatgpt|samsung|tesla|spacex|netflix|youtube|tiktok|intel|sony|ibm|oracle|uber|airbnb|spotify|linkedin|twitter";
const MARCA_CHINA = "byd|shein|shopee|temu|aliexpress|alibaba|huawei|xiaomi|geely|great wall|gwm|chery|deepseek|tencent|bytedance|lenovo|dji|haier|mixue|lululemon";
const MARCA_CONSUMO = "coca cola|coca|pepsi|mcdonald s|mcdonalds|mc donalds|burger king|nike|adidas|puma|disney|starbucks|nestle|red bull|heineken|ambev|zara|ferrari|porsche|bmw|mercedes|volkswagen|ford|chevrolet|fiat|toyota|honda|hyundai|jeep|renault|lamborghini|rolex|louis vuitton|gucci|chanel|hermes|lego|ikea|walmart|costco|carrefour|kfc|subway|outback|crocs|stanley|havaianas|boticario|natura|cacau show|kopenhagen|lacta|garoto|bauducco|sadia|seara|friboi|ype|omo|unilever|colgate|gillette|loreal|nivea|kodak|nokia|blackberry|motorola|nintendo|playstation|barbie|mattel|hot wheels|ray ban|oakley|victoria s secret|shell|ypiranga|ipiranga";
const MARCA_BR = "petrobras|itau|bradesco|nubank|santander|caixa economica|banco do brasil|magalu|magazine luiza|casas bahia|havan|globo|sbt|record|mercado livre|ifood|embraer|weg|jbs|vale do rio doce|renner|riachuelo|americanas|localiza|azul|gol|latam|correios|sus|pix|serasa|inss|fgts|bolsa familia|cvc|hering|reserva|centauro|netshoes|olx|picpay|stone|xp|btg|inter|c6|99|rappi|guarana|tramontina|wickbold|piracanjuba|itaipava|brahma|skol|antarctica|ypioca|51|chilli beans|o boticario|ri happy|positivo|multilaser|intelbras";
const FIGURA = "elon musk|musk|trump|donald trump|lula|bolsonaro|neymar|messi|cristiano ronaldo|zuckerberg|mark zuckerberg|bezos|jeff bezos|bill gates|jensen huang|sam altman|steve jobs|warren buffett|silvio santos|ratinho|virginia|xi jinping|putin|milei|biden|kim jong|anitta|faustao|luciano huck|xuxa|pele|ronaldinho|vini jr|vinicius junior|casimiro|felipe neto|whindersson|carlinhos maia|gusttavo lima|larissa manoela|alexandre de moraes|haddad|tarcisio|pablo marcal|janja|luciano hang|abilio diniz|lemann|eike batista|edir macedo|mrbeast|mr beast|taylor swift|tim cook|jack ma|lei jun|wang chuanfu|zhang yiming|jeff|oprah|beyonce|ana castela|ze felipe|tite|ancelotti|galvao bueno|roberto carlos|jorge ben|caetano|gil|vampeta|romario|ronaldo|kaka|zico|ayrton senna|senna|santos dumont|pablo escobar|escobar|einstein|tesla nikola|da vinci|napoleao|hitler|papa francisco|papa leao|papa";

// ---------- helpers ----------
const B = (s: string) => new RegExp(`\\b(${s})\\b`);
const RX = { PESSOA: B(PESSOA), PAIS_EST: B(PAIS_EST), REGIAO_BR: B(REGIAO_BR), BIGTECH: B(BIGTECH), MARCA_CHINA: B(MARCA_CHINA), MARCA_CONSUMO: B(MARCA_CONSUMO), MARCA_BR: B(MARCA_BR), FIGURA: B(FIGURA) };
// sem o memo do estudo: no servidor ele cresceria para sempre, e aqui são 6 hooks por sessão
const N = (t: string) => norm(t);

const PROPRIOS = new Set<string>(PROPRIOS_LISTA);
const primeira = (t: string) => (t ?? "").trim().replace(/^["“'(]+/, "").split(/\s+/)[0]?.replace(/[.,;:!?…"”')]+$/g, "") ?? "";
const segunda = (t: string) => (t ?? "").trim().replace(/^["“'(]+/, "").split(/\s+/)[1]?.replace(/^["“'(]+|[.,;:!?…"”')]+$/g, "") ?? "";
const ehProprio = (w: string) => !!w && /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(w) && PROPRIOS.has(w.toLowerCase());

// Números: redondo (1 a 10, múltiplo de 10, "1 milhão") x quebrado (47, 58, 3,7) x ano (1800 a 2099).
function numeros(t: string) {
  const out = { redondo: 0, quebrado: 0, ano: 0, pct: 0 };
  for (const m of (t ?? "").matchAll(/(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?\s*(%|por cento)?/g)) {
    const inteiro = Number(m[1].replace(/\./g, "")), dec = m[2];
    if (m[3]) out.pct++;
    if (!dec && !m[1].includes(".") && inteiro >= 1800 && inteiro <= 2099) { out.ano++; continue; }
    if (dec) { out.quebrado++; continue; }
    if (inteiro <= 10 || inteiro % 10 === 0) out.redondo++; else out.quebrado++;
  }
  return out;
}

const VERBO_PASSADO = "criou|criaram|inventou|inventaram|descobriu|descobriram|desenvolveu|desenvolveram|construiu|construiram|fundou|lancou|lancaram|destruiu|destruiram|faliu|faliram|quebrou|quebraram|perdeu|perderam|fechou|fecharam|afundou|venceu|venceram|derrotou|derrotaram|superou|superaram|ultrapassou|desbancou|humilhou|dominou|dominaram|proibiu|proibiram|baniu|baniram|bloqueou|multou|multaram|processou|processaram|prendeu|cancelou|cancelaram|expulsou|demitiu|comprou|compraram|vendeu|venderam|gastou|gastaram|pagou|pagaram|investiu|investiram|faturou|faturaram|lucrou|lucraram|ganhou|ganharam|arrecadou|economizou|ignorou|ignoraram|recusou|recusaram|rejeitou|abandonou|abandonaram|desistiu|largou|copiou|copiaram|roubou|roubaram|enganou|traiu|salvou|salvaram|transformou|transformaram|mudou|mudaram|virou|viraram|tornou|tornaram|conseguiu|conseguiram|decidiu|decidiram|resolveu|resolveram|revelou|revelaram|anunciou|anunciaram|admitiu|confessou|obrigou|forcou|desafiou|enfrentou|invadiu|invadiram|atacou|atacaram|ameacou|matou|morreu|sumiu|desapareceu|explodiu|parou|pararam|tirou|colocou|botou|deixou|fez|fizeram|deu|deram|trouxe|levou|encontrou|encontraram|achou|substituiu|eliminou|chocou|assustou|irritou|enfureceu|surpreendeu|apostou|aceitou|negou|exigiu|mandou|ofereceu|recebeu|ensinou|provou|mostrou|copiou|tentou|tentaram|comecou|comecaram|nasceu|surgiu|cresceu|explodiu";
const MOEDA = "r\\$|reais|us\\$|dolares|dolar|euros|libras";
const ESCALA = "milhoes|milhao|bilhoes|bilhao|trilhoes|trilhao|mil reais|mil dolares";

// ---------- características do HOOK ----------
// [id, grupo, descrição, fn(texto cru) => bool]
export const HOOK: [string, string, string, (t: string) => boolean][] = [
  // como começa
  ["ab_artigo", "abertura", "começa com A/O/Os/As", (t) => /^(a|o|os|as) /.test(N(t))],
  ["ab_artigo_nome", "abertura", "A/O + nome próprio (A China, O Google, A Apple)", (t) => /^(a|o|os|as)$/i.test(primeira(t)) && ehProprio(segunda(t))],
  ["ab_artigo_comum", "abertura", "A/O + substantivo comum (A empresa, O governo, O maior)", (t) => /^(a|o|os|as)$/i.test(primeira(t)) && !ehProprio(segunda(t))],
  ["ab_nome_sem_artigo", "abertura", "começa direto com nome próprio (Elon Musk, Trump, BYD)", (t) => ehProprio(primeira(t))],
  ["ab_demonstrativo", "abertura", "Esse/Essa/Esses/Este...", (t) => /^(esse|essa|esses|essas|este|esta|estes|estas) /.test(N(t))],
  ["ab_demonst_pessoa", "abertura", "Esse/Essa + tipo de pessoa (personagem anônimo)", (t) => new RegExp(`^(esse|essa|esses|essas|este|esta|estes|estas) (${PESSOA})\\b`).test(N(t))],
  ["ab_demonst_cara", "abertura", "Esse cara / Essa mulher / Esse homem", (t) => /^(esse|este) cara\b/.test(N(t))],
  ["ab_demonst_objeto", "abertura", "Esse/Essa + coisa (empresa, marca, IA, cidade)", (t) => /^(esse|essa|esses|essas|este|esta|estes|estas) /.test(N(t)) && !new RegExp(`^(esse|essa|esses|essas|este|esta|estes|estas) (${PESSOA})\\b`).test(N(t))],
  ["ab_um_uma", "abertura", "Um/Uma + substantivo (Uma cidade, Um brasileiro)", (t) => /^(um|uma) (?!dos\b|das\b)/.test(N(t))],
  ["ab_voce", "abertura", "Você / Se você", (t) => /^(voce|voces|vc|se voce|se voces)\b/.test(N(t))],
  ["ab_se_voce", "abertura", "Se você...", (t) => /^se voce/.test(N(t))],
  ["ab_pais", "abertura", "O Brasil/A China/Os EUA/O Japão...", (t) => /^(o brasil|a china|os eua|os estados unidos|o japao|a russia|a india|a coreia|a alemanha|a argentina|israel|a europa|o mexico|o canada|a australia|a suica|a italia|a espanha|portugal|a inglaterra|dubai|o ira\b|a arabia|a franca|o paraguai)\b/.test(N(t))],
  ["ab_china", "abertura", "A China...", (t) => /^a china\b/.test(N(t))],
  ["ab_brasil", "abertura", "O Brasil...", (t) => /^o brasil\b/.test(N(t))],
  ["ab_eua", "abertura", "Os EUA / Os Estados Unidos", (t) => /^(os |o )?(eua|estados unidos)\b/.test(N(t))],
  ["ab_numero", "abertura", "começa com número", (t) => /^(\d|dois |duas |tres |quatro |cinco |seis |sete |oito |nove |dez |cem |mil |metade )/.test(N(t))],
  ["ab_pergunta_qu", "abertura", "Por que / Como / O que / Qual / Quem / Quanto", (t) => /^(por que|porque|como|o que|qual|quais|quem|quanto|quantos|quantas|onde|sera que)\b/.test(N(t))],
  ["ab_por_que", "abertura", "Por que...", (t) => /^(por que|porque)\b/.test(N(t))],
  ["ab_como", "abertura", "Como...", (t) => /^como\b/.test(N(t))],
  ["ab_o_que", "abertura", "O que...", (t) => /^o que\b/.test(N(t))],
  ["ab_voce_sabia", "abertura", "Você sabia / Já pensou / Sabia que (genérico)", (t) => /^(voce sabia|sabia que|ja pensou|voce ja|ja parou|voce conhece|conhece)\b/.test(N(t))],
  ["ab_enquanto", "abertura", "Enquanto...", (t) => /^enquanto\b/.test(N(t))],
  ["ab_pouca_gente", "abertura", "Pouca gente / Quase ninguém / Ninguém / Poucos", (t) => /^(pouca gente|poucas pessoas|poucos|quase ninguem|ninguem|nenhum|nenhuma)\b/.test(N(t))],
  ["ab_existe", "abertura", "Existe um/uma / Tem um/uma", (t) => /^(existe|existem|tem um|tem uma|ha um|ha uma)\b/.test(N(t))],
  ["ab_superlativo", "abertura", "Uma das / Um dos / O maior / A maior / O primeiro", (t) => /^(uma das|um dos|o maior|a maior|os maiores|as maiores|o mais|a mais|o primeiro|a primeira|o unico|a unica|o menor|a menor|o melhor|a melhor|o pior|a pior)\b/.test(N(t))],
  ["ab_uma_das", "abertura", "Uma das / Um dos", (t) => /^(uma das|um dos)\b/.test(N(t))],
  ["ab_o_maior", "abertura", "O maior / A maior", (t) => /^(o maior|a maior|os maiores|as maiores)\b/.test(N(t))],
  ["ab_em", "abertura", "Em... (Em 2019, Em um, Em plena)", (t) => /^em /.test(N(t))],
  ["ab_tempo_atras", "abertura", "Antigamente / Durante / Há X anos / Nos anos / Em 19xx", (t) => /^(antigamente|durante|ha \d+|ha (mais de )?(cem|mil|dez|vinte|trinta|cinquenta|anos)|nos anos|na decada|desde|ate pouco tempo|em (19|20)\d\d|no ano de|ha decadas|ha seculos|por anos|por decadas|por muito tempo)\b/.test(N(t))],
  ["ab_imagina", "abertura", "Imagina / Imagine", (t) => /^(imagina|imagine)\b/.test(N(t))],
  ["ab_parece", "abertura", "Parece / Pode parecer", (t) => /^(parece|pode parecer|pode ate parecer|isso parece)\b/.test(N(t))],
  ["ab_muita_gente", "abertura", "Muita gente / Todo mundo / A maioria", (t) => /^(muita gente|muitas pessoas|muitos|todo mundo|a maioria|milhoes de)\b/.test(N(t))],
  ["ab_pronome", "abertura", "Ele/Ela/Eles", (t) => /^(ele|ela|eles|elas)\b/.test(N(t))],
  ["ab_isso", "abertura", "Isso / Isto / Olha", (t) => /^(isso|isto|olha|aqui)\b/.test(N(t))],
  ["ab_nem", "abertura", "Nem [grande] conseguiu...", (t) => /^nem\b/.test(N(t))],
  ["ab_os_as", "abertura", "Os/As + plural", (t) => /^(os|as) /.test(N(t))],
  ["ab_tem", "abertura", "Tem...", (t) => /^tem\b/.test(N(t))],

  // tempo e atualidade
  ["acabou_de", "tempo", "acabou de / acaba de", (t) => /\b(acabou|acaba|acabaram|acabam) de\b/.test(N(t))],
  ["agora", "tempo", "agora", (t) => /\bagora\b/.test(N(t))],
  ["hoje", "tempo", "hoje", (t) => /\bhoje\b/.test(N(t))],
  ["ano_2025_26", "tempo", "2025/2026 ou 'esse ano'", (t) => /\b(2025|2026|esse ano|este ano|neste ano|nesse ano)\b/.test(N(t))],
  ["tempo_recente", "tempo", "qualquer marca de agora (acabou de, agora, hoje, nesta semana, ontem, 2026, pela 1a vez, oficialmente)", (t) => /\b(acabou de|acaba de|acabaram de|acabam de|agora|hoje|neste momento|nesse momento|nesta semana|nessa semana|esta semana|essa semana|ontem|recentemente|pela primeira vez|oficialmente|2026|esse ano|este ano)\b/.test(N(t))],
  ["gerundio_esta", "tempo", "está/tá + -ndo (algo em curso)", (t) => /\b(esta|estao|ta|tao)\s+\w+ndo\b/.test(N(t))],
  ["ta_coloquial", "tempo", "tá / tão / tô / pra (coloquial)", (t) => /\b(ta|tao|to|pra|pro)\b/.test(N(t))],
  ["futuro_vai", "tempo", "vai + verbo / prestes a / em breve", (t) => /\b(vai|vao|ira|irao)\s+\w+(ar|er|ir)\b|\bprestes a\b|\bem breve\b/.test(N(t))],
  ["tempo_passado_ano", "tempo", "ano antigo (1800 a 2019) ou 'anos 80'", (t) => /\b(18|19)\d\d\b|\b20(0|1)\d\b|\banos (20|30|40|50|60|70|80|90)\b/.test(N(t))],

  // verbos
  ["verbo_passado", "verbo", "verbo de ação no passado (criou, destruiu, venceu...)", (t) => B(VERBO_PASSADO).test(N(t))],
  ["v_criou", "verbo", "criou/inventou/descobriu/desenvolveu/construiu/lançou", (t) => /\b(criou|criaram|inventou|inventaram|descobriu|descobriram|desenvolveu|desenvolveram|construiu|construiram|fundou|lancou|lancaram)\b/.test(N(t))],
  ["v_queda", "verbo", "destruiu/faliu/quebrou/perdeu/fechou", (t) => /\b(destruiu|destruiram|faliu|faliram|quebrou|quebraram|perdeu|perderam|fechou|fecharam|afundou)\b/.test(N(t))],
  ["v_venceu", "verbo", "venceu/derrotou/superou/ultrapassou/humilhou/dominou", (t) => /\b(venceu|venceram|derrotou|derrotaram|superou|superaram|ultrapassou|desbancou|humilhou|dominou|dominaram)\b/.test(N(t))],
  ["v_proibiu", "verbo", "proibiu/baniu/bloqueou/multou/processou/prendeu/cancelou", (t) => /\b(proibiu|proibiram|baniu|baniram|bloqueou|multou|multaram|processou|processaram|prendeu|cancelou|cancelaram|expulsou|demitiu)\b/.test(N(t))],
  ["v_dinheiro", "verbo", "comprou/vendeu/gastou/pagou/investiu/faturou/lucrou", (t) => /\b(comprou|compraram|vendeu|venderam|gastou|gastaram|pagou|pagaram|investiu|investiram|faturou|faturaram|lucrou|lucraram|arrecadou)\b/.test(N(t))],
  ["v_recusou", "verbo", "ignorou/recusou/rejeitou/abandonou/desistiu/largou", (t) => /\b(ignorou|ignoraram|recusou|recusaram|rejeitou|abandonou|abandonaram|desistiu|largou)\b/.test(N(t))],
  ["v_copiou", "verbo", "copiou/roubou/enganou/traiu", (t) => /\b(copiou|copiaram|roubou|roubaram|enganou|traiu)\b/.test(N(t))],
  ["v_transformou", "verbo", "transformou/mudou/virou/tornou", (t) => /\b(transformou|transformaram|mudou|mudaram|virou|viraram|tornou|tornaram)\b/.test(N(t))],
  ["v_fez", "verbo", "fez/deu/colocou/deixou/levou (verbo genérico)", (t) => /\b(fez|fizeram|deu|deram|colocou|botou|deixou|levou|tirou)\b/.test(N(t))],
  ["v_ser_capaz", "verbo", "é capaz de / consegue / pode (capacidade)", (t) => /\b(e capaz|sao capazes|capaz de|consegue|conseguem|pode|podem)\b/.test(N(t))],

  // dinheiro e números
  ["dinheiro", "numero", "qualquer dinheiro (R$, reais, dólares, milhões, bilhões, %)", (t) => new RegExp(`(${MOEDA})|\\b(${ESCALA}|fortuna|lucro|faturamento|prejuizo|divida)\\b|%`).test(N(t))],
  ["moeda", "numero", "R$ / reais / dólares", (t) => new RegExp(`(${MOEDA})`).test(N(t))],
  ["escala", "numero", "milhões / bilhões / trilhões", (t) => new RegExp(`\\b(${ESCALA})\\b`).test(N(t))],
  ["bilhao", "numero", "bilhão / bilhões / trilhão", (t) => /\b(bilhoes|bilhao|trilhoes|trilhao)\b/.test(N(t))],
  ["percentual", "numero", "% / por cento", (t) => /%|por cento/.test(t ?? "")],
  ["num_digito", "numero", "algum número em algarismo", (t) => /\d/.test(t ?? "")],
  ["num_redondo", "numero", "número redondo (10, 100, 1 milhão)", (t) => numeros(t).redondo > 0 && numeros(t).quebrado === 0],
  ["num_quebrado", "numero", "número quebrado (47, 58, 3,7)", (t) => numeros(t).quebrado > 0],
  ["num_ano", "numero", "ano em algarismo (1990, 2026)", (t) => numeros(t).ano > 0],
  ["num_por_extenso", "numero", "número por extenso (dois, cinco, dez, cem, mil)", (t) => /\b(dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|vinte|trinta|cem|cento|mil|metade|dobro|triplo)\b/.test(N(t))],

  // superlativo, sigilo, negação
  ["superlativo", "superlativo", "maior/menor/melhor/pior/primeiro/único/recorde/do mundo", (t) => /\b(maior|maiores|menor|menores|melhor|melhores|pior|piores|primeiro|primeira|primeiros|unico|unica|recorde|do mundo|da historia)\b/.test(N(t))],
  ["s_maior", "superlativo", "maior/maiores", (t) => /\b(maior|maiores)\b/.test(N(t))],
  ["s_primeiro", "superlativo", "primeiro/primeira", (t) => /\b(primeiro|primeira|primeiros|primeiras)\b/.test(N(t))],
  ["s_unico", "superlativo", "único/única/só um", (t) => /\b(unico|unica|unicos|unicas)\b/.test(N(t))],
  ["s_do_mundo", "superlativo", "do mundo / do planeta", (t) => /\b(do mundo|do planeta|no mundo)\b/.test(N(t))],
  ["s_da_historia", "superlativo", "da história", (t) => /\bda historia\b/.test(N(t))],
  ["s_mais_adj", "superlativo", "o/a mais + adjetivo (mais rico, mais odiado)", (t) => /\b(o|a|os|as) mais \w+/.test(N(t))],
  ["ninguem", "sigilo", "ninguém", (t) => /\bninguem\b/.test(N(t))],
  ["quase_ninguem", "sigilo", "quase ninguém / pouca gente / poucos sabem", (t) => /\b(quase ninguem|pouca gente|poucas pessoas|poucos sabem|pouquissimos|pouquissimas)\b/.test(N(t))],
  ["nunca", "sigilo", "nunca", (t) => /\bnunca\b/.test(N(t))],
  ["segredo", "sigilo", "segredo/secreto/escondido/oculto/por trás/mistério", (t) => /\b(segredo|segredos|secreto|secreta|escondido|escondida|escondidos|esconde|escondeu|escondem|oculto|oculta|misterio|misterioso|por tras)\b/.test(N(t))],
  ["proibido", "sigilo", "proibido/ilegal/clandestino/banido", (t) => /\b(proibid\w*|proibiu|ilegal|ilegais|clandestin\w*|banid\w*)\b/.test(N(t))],
  ["nao", "sigilo", "tem 'não'", (t) => /\bnao\b/.test(N(t))],

  // contraste e causa
  ["contraste", "contraste", "mas / só que / porém / enquanto / mesmo assim / em vez", (t) => /\b(mas|so que|porem|enquanto|mesmo assim|ao inves|em vez|no entanto|apesar)\b/.test(N(t))],
  ["c_mas", "contraste", "mas", (t) => /\bmas\b/.test(N(t))],
  ["c_so_que", "contraste", "só que", (t) => /\bso que\b/.test(N(t))],
  ["c_enquanto", "contraste", "enquanto (em qualquer posição)", (t) => /\benquanto\b/.test(N(t))],
  ["c_nem", "contraste", "nem", (t) => /\bnem\b/.test(N(t))],
  ["c_mesmo", "contraste", "mesmo / até mesmo", (t) => /\bmesmo\b/.test(N(t))],
  ["por_causa", "causa", "por causa de", (t) => /\bpor causa\b/.test(N(t))],
  ["porque", "causa", "porque", (t) => /\bporque\b/.test(N(t))],
  ["o_motivo", "causa", "o motivo / e o motivo", (t) => /\b(o motivo|os motivos|a razao)\b/.test(N(t))],
  ["e_o_motivo", "causa", "e o motivo (é...)", (t) => /\be o motivo\b/.test(N(t))],
  ["problema", "causa", "problema", (t) => /\bproblemas?\b/.test(N(t))],

  // quem e onde
  ["voce", "pessoa", "você/vocês", (t) => /\b(voce|voces|vc)\b/.test(N(t))],
  ["te", "pessoa", "te (te contar, te mostrar)", (t) => /\bte\b/.test(N(t))],
  ["seu_sua", "pessoa", "seu/sua (do espectador)", (t) => /\b(seu|sua|seus|suas)\b/.test(N(t))],
  ["segunda_pessoa", "pessoa", "qualquer 2a pessoa (você, te, seu)", (t) => /\b(voce|voces|vc|te|seu|sua|seus|suas)\b/.test(N(t))],
  ["eu_nos", "pessoa", "eu/meu/a gente/nosso", (t) => /\b(eu|meu|minha|a gente|nosso|nossa|nossos|nossas)\b/.test(N(t))],
  ["pessoa_comum", "pessoa", "pessoa comum (estudante, agricultor, motorista, idosa, criança)", (t) => /\b(estudante|estudantes|aluno|alunos|aluna|agricultor|agricultores|pescador|motorista|taxista|faxineira|pedreiro|vendedor|ambulante|aposentado|aposentada|dona de casa|mae solo|desempregado|desempregada|pobre|humilde|catador|morador de rua|crianca|criancas|menino|menina|garoto|garota|idoso|idosa|senhor|senhora|caminhoneiro|entregador|feirante|costureira|cozinheira)\b/.test(N(t))],
  ["especialista", "pessoa", "cientista/pesquisador/médico/engenheiro/universidade", (t) => /\b(cientista|cientistas|pesquisador|pesquisadores|pesquisadora|medico|medicos|medica|engenheiro|engenheiros|professor|especialista|especialistas|harvard|mit|stanford|universidade|usp|unicamp)\b/.test(N(t))],
  ["cargo_dono", "pessoa", "o dono / fundador / CEO / criador / herdeiro", (t) => /\b(dono|dona|donos|fundador|fundadora|ceo|criador|criadora|herdeiro|herdeira|presidente da|presidente do)\b/.test(N(t))],
  ["bilionario", "pessoa", "bilionário/milionário/ficou rico", (t) => /\b(bilionari\w*|milionari\w*|ficou rico|ficou rica|ficaram ricos)\b/.test(N(t))],
  ["figura", "entidade", "pessoa famosa (Musk, Trump, Lula, Neymar, Zuckerberg...)", (t) => RX.FIGURA.test(N(t))],
  ["elon", "entidade", "Elon Musk", (t) => /\b(elon|musk)\b/.test(N(t))],
  ["trump", "entidade", "Trump", (t) => /\btrump\b/.test(N(t))],
  ["bigtech", "entidade", "big tech (Apple, Google, Amazon, Microsoft, Meta, Nvidia, Samsung, Tesla)", (t) => RX.BIGTECH.test(N(t))],
  ["marca_china", "entidade", "marca chinesa (BYD, Shein, Shopee, Temu, Huawei, Xiaomi)", (t) => RX.MARCA_CHINA.test(N(t))],
  ["marca_consumo", "entidade", "marca de consumo global (Coca-Cola, McDonald's, Nike, Disney, Ferrari)", (t) => RX.MARCA_CONSUMO.test(N(t))],
  ["marca_br", "entidade", "marca/instituição brasileira (Petrobras, Nubank, Havan, Globo, Pix, SUS)", (t) => RX.MARCA_BR.test(N(t))],
  ["mega_marca", "entidade", "qualquer marca grande (big tech + consumo + chinesa + BR)", (t) => RX.BIGTECH.test(N(t)) || RX.MARCA_CHINA.test(N(t)) || RX.MARCA_CONSUMO.test(N(t)) || RX.MARCA_BR.test(N(t))],
  ["china", "entidade", "China/chinês", (t) => /\b(china|chines|chinesa|chineses|chinesas)\b/.test(N(t))],
  ["eua", "entidade", "EUA/americano", (t) => /\b(estados unidos|eua|americano|americana|americanos|americanas)\b/.test(N(t))],
  ["pais_est", "entidade", "qualquer país/lugar estrangeiro", (t) => RX.PAIS_EST.test(N(t))],
  ["brasil", "entidade", "Brasil/brasileiro", (t) => /\b(brasil|brasileir\w*)\b/.test(N(t))],
  ["regiao_br", "entidade", "estado/cidade/região do Brasil (Nordeste, Bahia, interior, SP)", (t) => RX.REGIAO_BR.test(N(t))],
  ["brasil_qualquer", "entidade", "Brasil ou região BR", (t) => /\b(brasil|brasileir\w*)\b/.test(N(t)) || RX.REGIAO_BR.test(N(t))],
  ["br_x_est", "entidade", "Brasil (ou região) E estrangeiro no mesmo hook", (t) => (/\b(brasil|brasileir\w*)\b/.test(N(t)) || RX.REGIAO_BR.test(N(t))) && RX.PAIS_EST.test(N(t))],
  ["so_est", "entidade", "só estrangeiro (sem Brasil)", (t) => !(/\b(brasil|brasileir\w*)\b/.test(N(t)) || RX.REGIAO_BR.test(N(t))) && RX.PAIS_EST.test(N(t))],
  ["interior", "entidade", "interior / cidade pequena / roça", (t) => /\b(interior|cidade pequena|cidadezinha|pequena cidade|vilarejo|roca|sitio|zona rural)\b/.test(N(t))],
  ["governo_lei", "entidade", "governo/lei/justiça/imposto/Receita/STF", (t) => /\b(governo|lei|leis|justica|stf|congresso|receita federal|prefeitura|anvisa|banco central|ministerio|imposto|impostos|taxa|taxou|multa|regra|regras)\b/.test(N(t))],
  ["ia", "entidade", "IA / inteligência artificial / ChatGPT / robô", (t) => /\b(ia|ias|inteligencia artificial|chatgpt|gpt|openai|claude|gemini|robo|robos)\b/.test(N(t))],
  ["empresa_marca", "entidade", "palavra 'empresa' ou 'marca' (genérica)", (t) => /\b(empresa|empresas|marca|marcas|startup|startups)\b/.test(N(t))],
  ["guerra", "entidade", "guerra/briga/contra/rival/ataque", (t) => /\b(guerra|briga|contra|batalha|ataque|atacou|ameaca|ameacou|inimigo|inimigos|rival|rivais|disputa)\b/.test(N(t))],
  ["mundo", "entidade", "o mundo / mundo inteiro / planeta", (t) => /\b(o mundo|mundo inteiro|o planeta|todo o mundo)\b/.test(N(t))],
  ["vida_sonho", "palavra", "vida / sonho / felicidade", (t) => /\b(vida|vidas|sonho|sonhos|felicidade)\b/.test(N(t))],
  ["hype_adj", "palavra", "adjetivo de hype (insano, absurdo, genial, bizarro, inacreditável)", (t) => /\b(insano|insana|absurdo|absurda|genial|geniais|bizarro|bizarra|inacreditavel|incrivel|surreal|louco|louca|loucura|assustador|assustadora|perturbador|perturbadora|chocante|impressionante|maluco|maluca)\b/.test(N(t))],
  ["historia_palavra", "palavra", "palavra 'história'", (t) => /\bhistoria\b/.test(N(t))],
  ["nome_proprio_qualquer", "entidade", "algum nome próprio no hook", (t) => { const w = (t ?? "").split(/\s+/); return w.some((x, i) => i > 0 && ehProprio(x.replace(/^["“'(]+|[.,;:!?…"”')]+$/g, ""))) || ehProprio(primeira(t)); }],
  ["sem_nome_proprio", "entidade", "hook sem nenhum nome próprio", (t) => { const w = (t ?? "").split(/\s+/); return !(w.some((x, i) => i > 0 && ehProprio(x.replace(/^["“'(]+|[.,;:!?…"”')]+$/g, ""))) || ehProprio(primeira(t))); }],

  // forma
  ["pal_ate12", "forma", "hook <= 12 palavras", (t) => palavras(t) <= 12],
  ["pal_13_17", "forma", "hook 13 a 17 palavras", (t) => palavras(t) >= 13 && palavras(t) <= 17],
  ["pal_18_22", "forma", "hook 18 a 22 palavras", (t) => palavras(t) >= 18 && palavras(t) <= 22],
  ["pal_23_27", "forma", "hook 23 a 27 palavras", (t) => palavras(t) >= 23 && palavras(t) <= 27],
  ["pal_28_34", "forma", "hook 28 a 34 palavras", (t) => palavras(t) >= 28 && palavras(t) <= 34],
  ["pal_35mais", "forma", "hook >= 35 palavras", (t) => palavras(t) >= 35],
  ["frases_1", "forma", "1 frase", (t) => frases(t).length === 1],
  ["frases_2", "forma", "2 frases", (t) => frases(t).length === 2],
  ["frases_3mais", "forma", "3+ frases", (t) => frases(t).length >= 3],
  ["frase_longa", "forma", "alguma frase com 25+ palavras", (t) => frases(t).some((f) => palavras(f) >= 25)],
  ["termina_pergunta", "forma", "termina em pergunta", (t) => /\?["”']?\s*$/.test(t ?? "")],
  ["tem_pergunta", "forma", "tem pergunta", (t) => /\?/.test(t ?? "")],
  ["reticencias", "forma", "termina em reticências", (t) => /(\.\.\.|…)["”']?\s*$/.test(t ?? "")],
  ["exclamacao", "forma", "tem exclamação", (t) => /!/.test(t ?? "")],
  ["virgula_0", "forma", "sem vírgula", (t) => !/,/.test((t ?? "").replace(/\d,\d/g, ""))],
  ["virgula_2mais", "forma", "2+ vírgulas", (t) => ((t ?? "").replace(/\d,\d/g, "").match(/,/g) ?? []).length >= 2],
  ["dois_pontos", "forma", "tem dois-pontos", (t) => /:/.test(t ?? "")],
  ["aspas", "forma", "tem aspas", (t) => /["“”]/.test(t ?? "")],
];


// ids das marcas que o hook tem (o f.hk do preditor offline)
export const marcasDoHook = (hook: string): string[] => HOOK.filter(([, , , fn]) => fn(hook)).map(([id]) => id);
