import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

// ======================================================
// CONFIGURAÇÕES DA GEOCODIFICAÇÃO
// ======================================================

const LIMIAR_CONFIRMADO = 0.75;
const LIMIAR_APROXIMADO = 0.5;
const RAIO_METROS = 30000;

const CATEGORIAS = [
    "tourism", "religion", "heritage", "leisure", "entertainment",
    "commercial", "catering", "building", "man_made", "beach", "natural",
].join(",");

// Hospedagem só entra na busca quando o local é do tipo "hospedagem".
const CATEGORIAS_COM_HOSPEDAGEM = `${CATEGORIAS},accommodation`;

// Se o resultado tem uma dessas palavras e o nome buscado não, é outro lugar
// (ex.: "Hostel Dragão do Mar" não é o "Centro Dragão do Mar").
const TIPOS_DIFERENTES = new Set([
    "hostel", "hotel", "pousada", "hospedagem", "apart", "apartamento",
    "flat", "estacionamento", "posto", "farmacia", "academia",
]);

type StatusLocal =
    | "confirmado"
    | "aproximado"
    | "outra_cidade"
    | "nao_encontrado";

type Candidato = {
    name?: string;
    address_line1?: string;
    formatted?: string;
    suburb?: string;
    district?: string;
    city?: string;
    lat: number;
    lon: number;
};

// Nomes populares/oficiais conhecidos. A busca já é limitada à cidade pelo raio.
const APELIDOS: { chaves: string[]; nomes: string[] }[] = [
    {
        chaves: ["mercado dos peixes", "mercado do peixe", "mercado de peixes"],
        nomes: [
            "Mercado dos Peixes do Mucuripe",
            "Mercado de Peixes do Mucuripe",
            "Mercado do Peixe Mucuripe",
        ],
    },
    {
        chaves: ["feira de artesanato", "feirinha da beira mar", "feira da beira mar"],
        nomes: [
            "Feira de Artesanato da Beira-Mar",
            "Feirinha da Beira-Mar",
            "Feirinha de Artesanato da Beira Mar",
            "Feira da Beira Mar",
        ],
    },
    {
        chaves: ["ponte dos ingleses", "ponte metalica", "ponte velha"],
        nomes: ["Ponte dos Ingleses", "Ponte Metálica", "Ponte Velha"],
    },
    {
        chaves: ["catedral metropolitana", "catedral de fortaleza", "catedral da se"],
        nomes: [
            "Catedral Metropolitana de Fortaleza",
            "Catedral de Fortaleza",
            "Catedral da Sé",
        ],
    },
];

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function normalizarTexto(texto: unknown): string {
    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

const CONECTORES = new Set([
    "de", "da", "do", "das", "dos", "e", "a", "o", "as", "os",
    "em", "na", "no", "com", "para",
]);

function tokens(texto: unknown, ignorar?: Set<string>): string[] {
    return [
        ...new Set(
            normalizarTexto(texto)
                .split(" ")
                .filter(
                    (t) =>
                        t.length >= 2 &&
                        !CONECTORES.has(t) &&
                        !ignorar?.has(t)
                )
        ),
    ];
}

// Tolera plural/gênero: "peixes" ~ "peixe", "ingleses" ~ "ingles".
function tokenIgual(a: string, b: string): boolean {
    return (
        a === b ||
        (a.length >= 5 && b.length >= 5 && a.slice(0, 5) === b.slice(0, 5))
    );
}

function pontuarNome(
    nomeBuscado: string,
    candidato: Candidato,
    ignorar: Set<string>
): number {
    const encontrados = tokens(candidato.name || candidato.address_line1 || "");

    if (encontrados.length === 0) return 0;

    if (
        encontrados.some((t) => TIPOS_DIFERENTES.has(t)) &&
        !tokens(nomeBuscado).some((t) => TIPOS_DIFERENTES.has(t))
    ) {
        return 0;
    }

    // Remove o nome da cidade da pesquisa para não perder pontos à toa.
    let buscados = tokens(nomeBuscado, ignorar);
    if (buscados.length === 0) buscados = tokens(nomeBuscado);
    if (buscados.length === 0) return 0;

    const acertos = buscados.filter((b) =>
        encontrados.some((e) => tokenIgual(b, e))
    );

    return acertos.length / buscados.length;
}

function distanciaMetros(
    a: { lat: number; lon: number },
    b: { lat: number; lon: number }
): number {
    const rad = (g: number) => (g * Math.PI) / 180;
    const R = 6371000;
    const dLat = rad(b.lat - a.lat);
    const dLon = rad(b.lon - a.lon);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

async function getJson(url: string, headers?: Record<string, string>) {
    const resposta = await fetch(url, { cache: "no-store", headers });

    if (!resposta.ok) {
        throw Object.assign(new Error(`HTTP ${resposta.status}`), {
            status: resposta.status,
        });
    }

    return resposta.json();
}

const ehNumero = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v);

// ======================================================
// GEOCODIFICAÇÃO DOS LOCAIS COM GEOAPIFY (+ NOMINATIM)
// ======================================================

// Dois locais com nomes parecidos (um contém o outro) no mesmo ponto são o mesmo lugar.
function nomesSemelhantes(a: string, b: string): boolean {
    const ta = tokens(a);
    const tb = tokens(b);

    if (ta.length === 0 || tb.length === 0) return false;

    const [menor, maior] = ta.length <= tb.length ? [ta, tb] : [tb, ta];

    return menor.every((t) => maior.some((u) => tokenIgual(t, u)));
}

function mesclarDuplicados(lista: any[]): any[] {
    const unicos: any[] = [];

    for (const r of lista) {
        if (ehNumero(r.latitude) && ehNumero(r.longitude)) {
            const duplicado = unicos.find(
                (u) =>
                    ehNumero(u.latitude) &&
                    ehNumero(u.longitude) &&
                    distanciaMetros(
                        { lat: u.latitude, lon: u.longitude },
                        { lat: r.latitude, lon: r.longitude }
                    ) <= 30 &&
                    nomesSemelhantes(u.nome, r.nome)
            );

            if (duplicado) {
                duplicado.dias = [
                    ...new Set([...(duplicado.dias ?? []), ...(r.dias ?? [])]),
                ];
                continue;
            }
        }

        unicos.push(r);
    }

    return unicos;
}

// Ordem lógica do dia: manhã → almoço → tarde → jantar → noite.
const ORDEM_PERIODO: Record<string, number> = {
    manha: 1,
    almoco: 2,
    tarde: 3,
    jantar: 4,
    noite: 5,
};

function ordenarLocais(lista: any[]): any[] {
    const chave = (l: any): [number, number] => [
        Number.isFinite(Number(l.dia)) ? Number(l.dia) : 99,
        ORDEM_PERIODO[normalizarTexto(l.periodo)] ?? 9,
    ];

    return [...lista].sort((a, b) => {
        const [diaA, periodoA] = chave(a);
        const [diaB, periodoB] = chave(b);
        return diaA - diaB || periodoA - periodoB;
    });
}

async function geocodificarLocais(locaisBrutos: any[], destino: string) {
    const apiKey = process.env.GEOAPIFY_API_KEY;
    const nomeCidade = destino.split(",")[0].trim();
    const ignorar = new Set([...tokens(destino), "brasil", "brazil"]);

    // Descarta registros sem nome e junta repetidos (mesmo local em vários
    // dias vira um só, com a lista de dias em "dias").
    const porNome = new Map<string, any>();

    for (const l of Array.isArray(locaisBrutos) ? locaisBrutos : []) {
        const nome = String(l?.nome ?? l?.name ?? "").trim();

        if (!nome) {
            console.warn("Local sem nome descartado:", l);
            continue;
        }

        const chave = tokens(nome, ignorar).join(" ") || normalizarTexto(nome);
        const existente = porNome.get(chave);
        const dia = l?.dia;

        if (existente) {
            if (dia != null && !existente.dias.includes(dia)) {
                existente.dias.push(dia);
            }
            continue;
        }

        porNome.set(chave, { ...l, nome, dias: dia != null ? [dia] : [] });
    }

    const locais = [...porNome.values()];

    const falha = (
        local: any,
        status: StatusLocal,
        aviso: string,
        extra: any = {}
    ) => ({
        ...local,
        latitude: undefined,
        longitude: undefined,
        enderecoEncontrado: undefined,
        status,
        aviso,
        ...extra,
    });

    const naoEncontrado = (local: any) =>
        falha(
            local,
            "nao_encontrado",
            `Não foi possível confirmar a localização de "${local.nome}" em ${nomeCidade}.`
        );

    if (!apiKey) {
        console.error("GEOAPIFY_API_KEY não encontrada.");
        return locais.map(naoEncontrado);
    }

    try {
        // 1. Centro do destino.
        const dadosCidade = await getJson(
            `https://api.geoapify.com/v1/geocode/search?${new URLSearchParams({
                text: destino,
                type: "city",
                format: "json",
                limit: "5",
                apiKey,
            })}`
        );

        const resultadosCidade: any[] = dadosCidade.results ?? [];
        const comCoordenadas = (r: any) => ehNumero(r.lat) && ehNumero(r.lon);

        const cidade =
            resultadosCidade.find(
                (r) =>
                    comCoordenadas(r) &&
                    normalizarTexto(r.city || r.name) ===
                    normalizarTexto(nomeCidade)
            ) ?? resultadosCidade.find(comCoordenadas);

        if (!cidade) {
            return locais.map((l) =>
                falha(
                    l,
                    "nao_encontrado",
                    `Não foi possível identificar o destino "${destino}". Verifique o nome da cidade.`
                )
            );
        }

        const centro = { lat: Number(cidade.lat), lon: Number(cidade.lon) };
        const filtroCirculo = `circle:${centro.lon},${centro.lat},${RAIO_METROS}`;
        const proximidade = `proximity:${centro.lon},${centro.lat}`;
        const filtroPais = cidade.country_code
            ? `countrycode:${cidade.country_code}`
            : undefined;

        console.log("MUNICÍPIO IDENTIFICADO:", {
            cidade: cidade.city || cidade.name,
            pais: cidade.country,
            centro,
        });

        const dentroDoRaio = (c: Candidato) =>
            distanciaMetros(centro, c) <= RAIO_METROS;

        // --- Fontes de busca ---

        const buscarPlaces = async (
            nome: string,
            comHospedagem = false
        ): Promise<Candidato[]> => {
            const dados = await getJson(
                `https://api.geoapify.com/v2/places?${new URLSearchParams({
                    categories: comHospedagem
                        ? CATEGORIAS_COM_HOSPEDAGEM
                        : CATEGORIAS,
                    name: nome,
                    filter: filtroCirculo,
                    bias: proximidade,
                    limit: "20",
                    apiKey,
                })}`
            );

            return (dados.features ?? []).map((f: any) => ({
                name: f.properties?.name,
                address_line1: f.properties?.address_line1,
                formatted: f.properties?.formatted,
                suburb: f.properties?.suburb,
                district: f.properties?.district,
                city: f.properties?.city,
                lat: f.properties?.lat,
                lon: f.properties?.lon,
            }));
        };

        const buscarGeocode = async (
            texto: string,
            filtro: string | undefined = filtroCirculo
        ): Promise<Candidato[]> => {
            const parametros = new URLSearchParams({
                text: texto,
                format: "json",
                limit: "5",
                bias: proximidade,
                apiKey,
            });
            if (filtro) parametros.set("filter", filtro);

            const dados = await getJson(
                `https://api.geoapify.com/v1/geocode/search?${parametros}`
            );

            return (dados.results ?? []).map((r: any) => ({
                name: r.name,
                address_line1: r.address_line1,
                formatted: r.formatted,
                suburb: r.suburb,
                district: r.district,
                city: r.city || r.town || r.village || r.municipality,
                lat: r.lat,
                lon: r.lon,
            }));
        };

        // Nominatim: no máximo 1 requisição por segundo.
        let ultimaNominatim = 0;
        let nominatimBloqueado = false;

        const buscarNominatim = async (q: string): Promise<Candidato[]> => {
            if (nominatimBloqueado) return [];

            const espera = 1100 - (Date.now() - ultimaNominatim);
            if (espera > 0) await new Promise((r) => setTimeout(r, espera));
            ultimaNominatim = Date.now();

            const d = 0.3; // ~33 km em volta do centro
            try {
                const dados = await getJson(
                    `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
                        q,
                        format: "jsonv2",
                        limit: "5",
                        viewbox: `${centro.lon - d},${centro.lat + d},${centro.lon + d},${centro.lat - d}`,
                        bounded: "1",
                    })}`,
                    { "User-Agent": "TripIA/1.0" }
                );

                return dados.map((item: any) => ({
                    name:
                        item.name ||
                        String(item.display_name ?? "").split(",")[0],
                    formatted: item.display_name,
                    lat: Number(item.lat),
                    lon: Number(item.lon),
                }));
            } catch (error: any) {
                if (error?.status === 403 || error?.status === 429) {
                    nominatimBloqueado = true;
                }
                throw error;
            }
        };

        // --- Resolução de cada local ---

        const resolver = async (local: any) => {
            const apelidosConhecidos = APELIDOS.filter((a) =>
                a.chaves.some((c) => normalizarTexto(local.nome).includes(c))
            ).flatMap((a) => a.nomes);

            const nomes = [
                ...new Set(
                    [
                        local.nome,
                        ...(Array.isArray(local.nomes_alternativos)
                            ? local.nomes_alternativos
                            : []),
                        ...apelidosConhecidos,
                    ].filter(
                        (n): n is string =>
                            typeof n === "string" && n.trim().length > 0
                    )
                ),
            ];

            // Bairro sugerido pela IA: só serve de desempate, nunca rejeita.
            const bairros = tokens(local.bairro, ignorar);

            const estado: {
                melhor: { c: Candidato; score: number; rank: number } | null;
            } = { melhor: null };

            const avaliar = (candidatos: Candidato[]) => {
                for (const c of candidatos) {
                    if (!ehNumero(c.lat) || !ehNumero(c.lon)) continue;
                    if (!dentroDoRaio(c)) continue;

                    const score = Math.max(
                        ...nomes.map((n) => pontuarNome(n, c, ignorar))
                    );
                    if (score <= 0) continue;

                    const textoRegiao = tokens(
                        `${c.formatted ?? ""} ${c.suburb ?? ""} ${c.district ?? ""}`
                    );
                    const bonus = bairros.some((b) =>
                        textoRegiao.some((t) => tokenIgual(b, t))
                    )
                        ? 0.05
                        : 0;

                    const rank = score + bonus;

                    if (!estado.melhor || rank > estado.melhor.rank) {
                        estado.melhor = { c, score, rank };
                    }
                }
            };

            const etapas: (() => Promise<Candidato[]>)[] = [
                ...nomes.map(
                    (n) => () => buscarPlaces(n, local.tipo === "hospedagem")
                ),
                ...nomes.map((n) => () => buscarGeocode(`${n}, ${nomeCidade}`)),
                ...nomes
                    .slice(0, 2)
                    .map((n) => () => buscarNominatim(`${n}, ${destino}, Brasil`)),
            ];

            for (const etapa of etapas) {
                if (estado.melhor && estado.melhor.score >= LIMIAR_CONFIRMADO) {
                    break;
                }
                try {
                    avaliar(await etapa());
                } catch (error) {
                    console.warn("Falha em uma etapa de busca:", local.nome, error);
                }
            }

            const achado = estado.melhor;

            if (achado && achado.score >= LIMIAR_CONFIRMADO) {
                return {
                    ...local,
                    latitude: achado.c.lat,
                    longitude: achado.c.lon,
                    enderecoEncontrado: achado.c.formatted,
                    status: "confirmado" as StatusLocal,
                };
            }

            if (achado && achado.score >= LIMIAR_APROXIMADO) {
                return {
                    ...local,
                    latitude: achado.c.lat,
                    longitude: achado.c.lon,
                    enderecoEncontrado: achado.c.formatted,
                    status: "aproximado" as StatusLocal,
                    aviso: `A localização de "${local.nome}" é aproximada (encontrado: "${achado.c.name}").`,
                };
            }

            // Nada confiável na cidade: só agora procura em outras cidades.
            if (filtroPais) {
                for (const nome of nomes) {
                    try {
                        const candidatos = await buscarGeocode(nome, filtroPais);

                        for (const c of candidatos) {
                            if (!ehNumero(c.lat) || !ehNumero(c.lon)) continue;

                            const score = pontuarNome(nome, c, ignorar);

                            if (score >= LIMIAR_CONFIRMADO && !dentroDoRaio(c)) {
                                return falha(
                                    local,
                                    "outra_cidade",
                                    `"${local.nome}" parece ficar em ${c.city || "outra cidade"}, e não em ${nomeCidade}.`,
                                    { cidadeEncontrada: c.city }
                                );
                            }
                        }
                    } catch (error) {
                        console.warn("Falha ao buscar em outra cidade:", nome, error);
                    }
                }
            }

            return naoEncontrado(local);
        };

        const resultados: any[] = [];

        for (const local of locais) {
            try {
                const r = await resolver(local);
                console.log("GEOCODIFICAÇÃO:", {
                    local: local.nome,
                    status: r.status,
                    lat: r.latitude,
                    lon: r.longitude,
                    endereco: r.enderecoEncontrado,
                });
                resultados.push(r);
            } catch (error) {
                console.error(`Erro ao localizar ${local.nome}:`, error);
                resultados.push(naoEncontrado(local));
            }
        }

        // Avisa sobre coordenadas repetidas.
        const coordenadas = new Map<string, string>();
        for (const r of resultados) {
            if (!ehNumero(r.latitude) || !ehNumero(r.longitude)) continue;
            const chave = `${r.latitude.toFixed(5)},${r.longitude.toFixed(5)}`;
            if (coordenadas.has(chave)) {
                console.warn("COORDENADAS REPETIDAS:", coordenadas.get(chave), "e", r.nome);
            } else {
                coordenadas.set(chave, r.nome);
            }
        }

        console.log("TOTAL DE LOCAIS RECEBIDOS:", locais.length);
        console.log(
            "TOTAL DE LOCAIS COM COORDENADAS:",
            resultados.filter((r) => ehNumero(r.latitude) && ehNumero(r.longitude)).length
        );

        return ordenarLocais(mesclarDuplicados(resultados));
    } catch (error) {
        console.error("Erro ao geocodificar locais:", error);
        return locais.map(naoEncontrado);
    }
}

// ======================================================
// INTERPRETAÇÃO DA RESPOSTA DA IA
// ======================================================

function interpretarResposta(texto: string) {
    const jsonLimpo = texto
        .replace(/^\uFEFF/, "")
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    try {
        return JSON.parse(jsonLimpo);
    } catch (error) {
        console.error("JSON inválido retornado pela IA.");

        if (error instanceof SyntaxError) {
            const posicao = Number(
                error.message.match(/position (\d+)/)?.[1]
            );

            if (Number.isFinite(posicao)) {
                console.error(
                    "Trecho problemático:",
                    jsonLimpo.slice(
                        Math.max(0, posicao - 150),
                        posicao + 150
                    )
                );
            }
        }

        throw new Error(
            "A IA retornou um JSON inválido. Tente gerar o roteiro novamente."
        );
    }
}

// ======================================================
// API PRINCIPAL DE GERAÇÃO DE ROTEIROS
// ======================================================

export async function POST(request: NextRequest) {
    try {
        const dados = await request.json();

        const {
            origem,
            destino,
            ida,
            volta,
            viajantes,
            transporte,
            preferencias,
            orcamento,
            observacoes,
        } = dados;

        // Validar informações obrigatórias.
        if (
            typeof origem !== "string" ||
            !origem.trim() ||
            typeof destino !== "string" ||
            !destino.trim() ||
            !ida ||
            !volta
        ) {
            return NextResponse.json(
                {
                    erro: "Preencha origem, destino e datas da viagem.",
                },
                { status: 400 }
            );
        }

        // Validar demais informações.
        if (
            !Array.isArray(preferencias) ||
            !Number.isInteger(Number(viajantes)) ||
            Number(viajantes) < 1 ||
            Number(viajantes) > 8 ||
            (
                orcamento !== null &&
                orcamento !== undefined &&
                (
                    !Number.isFinite(Number(orcamento)) ||
                    Number(orcamento) < 0
                )
            )
        ) {
            return NextResponse.json(
                {
                    erro: "Algumas informações da viagem são inválidas.",
                },
                { status: 400 }
            );
        }

        const groqApiKey = process.env.GROQ_API_KEY;

        if (!groqApiKey) {
            throw new Error("GROQ_API_KEY não encontrada no .env.local.");
        }

        const groq = new Groq({
            apiKey: groqApiKey,
        });

        // ==================================================
        // PROMPT DO TRIPIA
        // ==================================================

        const prompt = `
Você é o assistente de viagens oficial do TripIA.

Crie um roteiro de viagem personalizado, detalhado e realista.

DADOS DA VIAGEM:

Origem: ${origem}

Destino: ${destino}

Data de ida: ${ida}

Data de volta: ${volta}

Quantidade de viajantes: ${viajantes}

Transporte: ${transporte}

Preferências: ${preferencias.join(", ") || "Não informadas"}

Orçamento: ${orcamento ? `R$ ${orcamento}` : "Não informado"}

Observações: ${observacoes || "Nenhuma"}


INSTRUÇÕES DO ROTEIRO:

1. Organize o roteiro por dia, considerando as datas da viagem.

2. Sugira atrações turísticas relevantes e experiências adequadas ao destino.

3. Considere as preferências, o orçamento e a quantidade de viajantes.

4. Agrupe passeios próximos geograficamente, evitando deslocamentos desnecessários.

5. Sugira restaurantes e experiências gastronômicas.

6. Apresente estimativas de gastos quando possível.

7. Considere o orçamento informado.

8. Inclua dicas úteis de viagem.

9. Não invente preços atuais, horários de funcionamento ou disponibilidade.

10. Identifique claramente informações estimadas.

11. Considere todo o período entre a ida e a volta.

12. Apresente sugestões adequadas à quantidade de viajantes.

13. INTERPRETAÇÃO DOS PEDIDOS DO USUÁRIO:
- Entenda as observações do usuário como uma conversa natural, não como comandos técnicos.
- Identifique automaticamente os lugares, atrações, restaurantes e experiências que o usuário deseja visitar.
- Reconheça nomes populares, abreviações, apelidos, nomes incompletos e pequenos erros de digitação.
- Utilize o contexto do destino para identificar corretamente os locais mencionados.
- Quando o usuário mencionar lugares específicos, considere cada um deles como uma preferência obrigatória do roteiro.
- Não ignore, substitua ou remova locais solicitados pelo usuário apenas para sugerir atrações mais conhecidas.
- Inclua todos os locais identificáveis mencionados pelo usuário no roteiro e no campo "locais".
- Utilize o nome oficial ou a identificação mais conhecida do estabelecimento, mantendo a referência ao nome utilizado pelo usuário quando necessário.
- Organize os locais solicitados de maneira lógica, considerando distância, localização e período da viagem.
- Não invente estabelecimentos ou atrações para preencher a lista.
- Se um local não puder ser identificado com segurança, não invente informações sobre ele.

14. Inclua os locais recomendados no campo "locais".

15. Priorize locais reais e identificáveis no destino informado.

16. Não invente endereços ou coordenadas.

17. O campo "endereco" deve conter apenas bairro e cidade, e somente se você tiver certeza. Se não tiver certeza, deixe vazio. Nunca invente nomes de ruas ou números.

18. O campo "bairro" deve conter apenas o nome do bairro, se você tiver certeza. Caso contrário, deixe vazio.

19. O campo "nomes_alternativos" deve listar nomes populares, oficiais, apelidos e variações de escrita do local (por exemplo, "Ponte Metálica" para "Ponte dos Ingleses"). Se não houver, retorne uma lista vazia.

20. LÓGICA DO DIA (muito importante):
- Monte cada dia seguindo a ordem natural: manhã → almoço → tarde → jantar → noite.
- Coloque cada local no período em que ele faz mais sentido pela sua natureza:
  * Mercados de peixe, restaurantes de frutos do mar, barracas de praia e comida típica de rua: ALMOÇO (fica no meio do dia).
  * Restaurantes mais elaborados e de ambiente sofisticado (por exemplo, Coco Bambu): JANTAR (fica no final do dia).
  * Igrejas, catedrais, museus, centros culturais e centro histórico: MANHÃ ou início da TARDE.
  * Praias e passeios ao ar livre: MANHÃ ou TARDE.
  * Pôr do sol, pontes, orlas, mirantes e calçadões: FIM DA TARDE.
  * Feiras de artesanato, bares, música ao vivo e vida noturna: NOITE.
- Se o usuário indicar um período para um local ("coco bambu no jantar"), respeite exatamente.
- Cada dia deve ter no máximo um almoço e um jantar.
- Dentro de cada dia, agrupe locais próximos e evite ziguezague pela cidade.
- Distribua os locais ao longo de todos os dias da viagem, sem concentrar tudo no primeiro dia.
- No texto do roteiro, siga a mesma ordem e os mesmos períodos usados no campo "locais".

21. Cada local deve aparecer UMA ÚNICA vez no campo "locais", no dia e período em que melhor se encaixa, mesmo que seja mencionado em mais de um trecho do roteiro.


FORMATO DO ROTEIRO:

# Apresentação da viagem

# Resumo do destino

# Roteiro separado por dia

# Atrações e atividades sugeridas

# Sugestões gastronômicas

# Estimativa de gastos

- Apresente cada categoria de gasto com seu respectivo valor em negrito.

- Destaque obrigatoriamente o TOTAL ESTIMADO em negrito.

- Separe transporte, hospedagem, alimentação e passeios.

- Informe o custo total e, quando possível, o custo por pessoa.

- Não invente valores exatos; apresente estimativas coerentes.

# Dicas importantes

Escreva em português brasileiro, utilizando Markdown.

Organize os dias com títulos e atividades separadas por manhã, almoço, tarde, jantar e noite, seguindo a lógica do dia descrita na regra 20.

FORMATO OBRIGATÓRIO DA RESPOSTA:

Retorne exclusivamente um JSON válido, sem blocos Markdown ou explicações fora do JSON.

A estrutura deve ser:

{

  "roteiro": "Todo o roteiro completo em Markdown, com as seções solicitadas.",

  "locais": [

    {

      "nome": "Nome real do local",

      "endereco": "Bairro, Cidade (ou vazio se não tiver certeza)",

      "bairro": "Bairro (ou vazio)",

      "nomes_alternativos": ["Nome popular ou oficial alternativo"],

      "tipo": "atracao",

      "dia": 1,

      "periodo": "manhã"

    }

  ]

}

REGRAS DO CAMPO LOCAIS:

- Inclua atrações, restaurantes e outros pontos mencionados no roteiro.

- Use tipo "atracao", "restaurante" ou "hospedagem".

- O dia deve ser um número inteiro correspondente ao dia do roteiro.

- O período deve ser "manhã", "almoço", "tarde", "jantar" ou "noite".

- Não inclua locais que não aparecem nas sugestões do roteiro.

- Não invente coordenadas geográficas.

- Todo local deve ter o campo "nome" preenchido.

- Nunca repita o mesmo local na lista.

- Liste os locais em ordem cronológica: primeiro por dia, depois por período (manhã, almoço, tarde, jantar, noite).

- Se não houver locais identificáveis, retorne uma lista vazia.
`;

        // ==================================================
        // SOLICITAÇÃO AO GROQ
        // ==================================================

        console.log("Iniciando geração de roteiro com Groq...");

        const respostaGroq = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
                {
                    role: "system",
                    content:
                        "Você é o assistente de viagens oficial do TripIA. " +
                        "Siga rigorosamente as instruções e retorne exclusivamente JSON válido.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            response_format: {
                type: "json_object",
            },
            temperature: 0.3,
            max_completion_tokens: 8192,
        });

        console.log("Resposta recebida do Groq.");

        const texto = respostaGroq.choices[0]?.message?.content;

        if (typeof texto !== "string" || !texto.trim()) {
            throw new Error("O Groq retornou uma resposta vazia.");
        }

        const resultado = interpretarResposta(texto);

        if (
            !resultado ||
            typeof resultado.roteiro !== "string" ||
            !Array.isArray(resultado.locais)
        ) {
            throw new Error("A resposta da IA possui um formato inválido.");
        }

        // ==================================================
        // GEOCODIFICAR LOCAIS
        // ==================================================

        const locaisGeocodificados = await geocodificarLocais(
            resultado.locais,
            destino
        );

        console.log("DESTINO:", destino);

        console.log(
            "LOCAIS RETORNADOS PELA IA:",
            JSON.stringify(resultado.locais, null, 2)
        );

        console.log(
            "LOCAIS APÓS GEOCODIFICAÇÃO:",
            JSON.stringify(locaisGeocodificados, null, 2)
        );

        // ==================================================
        // AVISOS PARA O FRONTEND
        // ==================================================

        const avisos = locaisGeocodificados
            .filter((local: any) => local.status && local.status !== "confirmado")
            .map((local: any) => ({
                nome: local.nome,
                tipo: local.status,
                cidadeEncontrada: local.cidadeEncontrada,
                mensagem: local.aviso,
            }));

        // ==================================================
        // RESPOSTA PARA O FRONTEND
        // ==================================================

        return NextResponse.json({
            sucesso: true,
            roteiro: resultado.roteiro,
            locais: locaisGeocodificados,
            avisos,
        });
    } catch (error) {
        console.error("Erro ao gerar roteiro:", error);

        const mensagem =
            error instanceof Error ? error.message : "";

        if (
            mensagem.includes("503") ||
            mensagem.includes("UNAVAILABLE") ||
            mensagem.includes("overloaded")
        ) {
            return NextResponse.json(
                {
                    erro: "O serviço de IA está temporariamente sobrecarregado. Aguarde alguns instantes e tente novamente.",
                },
                { status: 503 }
            );
        }

        if (
            mensagem.includes("429") ||
            mensagem.includes("RESOURCE_EXHAUSTED") ||
            mensagem.includes("rate limit")
        ) {
            return NextResponse.json(
                {
                    erro: "O limite de requisições da IA foi atingido. Tente novamente mais tarde.",
                },
                { status: 429 }
            );
        }

        if (
            mensagem.includes("401") ||
            mensagem.includes("API_KEY_INVALID") ||
            mensagem.includes("Invalid API Key") ||
            mensagem.includes("PERMISSION_DENIED")
        ) {
            return NextResponse.json(
                {
                    erro: "A chave da IA é inválida ou não possui permissão para acessar a API.",
                },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                erro: "Não foi possível gerar o roteiro. Verifique o terminal para mais detalhes.",
            },
            { status: 500 }
        );
    }
}