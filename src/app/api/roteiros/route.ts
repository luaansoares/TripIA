import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { criarLocalizacaoFinanceiraUniversal } from "@/services/financeiro/localizacao";
import { criarDadosPrecosEstimados } from "@/services/financeiro/estimativas";
import { buscarPrecoCombustivel } from "@/services/financeiro/combustivel";

// ======================================================
// CONFIGURAÇÕES
// ======================================================
// Limite de dias por roteiro (o plano atual do Groq permite 8000 tokens/min).
const MAX_DIAS = 7;
const MAX_TOKENS_SAIDA = 4500;

// ======================================================
// CONFIGURAÇÕES DA GEOCODIFICAÇÃO
// ======================================================
const LIMIAR_CONFIRMADO = 0.75;
const LIMIAR_APROXIMADO = 0.5;
// Cobre a região metropolitana (Caucaia/Cumbuco, Aquiraz, Eusébio...).
const RAIO_METROS = 50000;

const CATEGORIAS = [
    "tourism", "religion", "heritage", "leisure", "entertainment",
    "commercial", "catering", "building", "man_made", "beach", "natural",
].join(",");

// O alojamento só entra na pesquisa quando o local é do tipo "hospedagem".
const CATEGORIAS_COM_HOSPEDAGEM = `${CATEGORIAS},accommodation`;

// Se o resultado tem uma dessas palavras e o nome pesquisado não, é outro lugar
// (ex.: "Hostel Dragão do Mar" não é o "Centro Dragão do Mar").
const TIPOS_DIFERENTES = new Set<string>([
    "hostel", "hotel", "pousada", "hospedagem", "apart", "apartamento",
    "flat", "estacionamento", "posto", "farmacia", "academia",
]);

// Palavras que indicam o TIPO de estabelecimento/estrutura.
const TIPOS_ESTRUTURAIS = new Set<string>([
    ...Array.from(TIPOS_DIFERENTES),
    "edificio",
    "rua",
    "avenida",
    "rodovia",
    "estrada",
    "praia",
    "bar",
    "restaurante",
    "lagoa",
    "duna",
    "parque",
    "museu",
    "mercado",
    "feira",
    "igreja",
    "hotel",
    "pousada",
    // Outros tipos que indicam um lugar diferente do pedido.
    "santuario",
    "capela",
    "paroquia",
    "basilica",
    "cooperativa",
    "associacao",
    "hospital",
    "clinica",
    "escola",
    "colegio",
    "faculdade",
    "universidade",
    "banco",
    "camara",
    "paco",
]);

// Palavras genéricas não devem determinar sozinhas a correspondência.
const TERMOS_GENERICOS = new Set<string>([
    "bar",
    "restaurante",
    "lanchonete",
    "praia",
    "parque",
    "museu",
    "mercado",
    "centro",
    "igreja",
    "praca",
    "lagoa",
    "duna",
    "feira",
    "hotel",
    "pousada",
    "hostel",
    "shopping",
    "ponte",
    "beach",
    "club",
    "clube",
]);

// Nomes de lugar genéricos demais para serem aceitos com score baixo.
const NOMES_GENERICOS_UNICOS = [
    "praia", "rua", "avenida", "lagoa", "praca", "rodovia", "estrada",
];

type StatusLocal =
    | "confirmado"
    | "aproximado"
    | "outra_cidade"
    | "nao_encontrado";

type Candidato = {
    name?: string;
    categoria?: string;
    address_line1?: string;
    formatted?: string;
    suburb?: string;
    district?: string;
    city?: string;
    lat: number;
    lon: number;
};

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

// Troca hífens especiais (‑ – —) pelo hífen normal e limpa espaços.
function limparNome(nome: string): string {
    return nome
        .replace(/[\u2010-\u2015\u2212]/g, "-")
        .replace(/\s+/g, " ")
        .trim();
}

// "Praia de Cumbuco" também é pesquisada como "Cumbuco".
function variantesDoNome(nome: string): string[] {
    const base = limparNome(nome);
    const semPraia = base.replace(/^praia\s+(de|do|da)\s+/i, "").trim();
    return Array.from(new Set([base, semPraia].filter((n) => n.length >= 3)));
}

const CONECTORES = new Set<string>([
    "de", "da", "do", "das", "dos", "e", "a", "o", "as", "os",
    "em", "na", "no", "com", "para",
]);

function tokens(texto: unknown, ignorar?: Set<string>): string[] {
    return Array.from(
        new Set(
            normalizarTexto(texto)
                .split(" ")
                .filter(
                    (t) =>
                        t.length >= 2 &&
                        !CONECTORES.has(t) &&
                        !ignorar?.has(t)
                )
        )
    );
}

// Tolera plural/género: "peixes" ~ "peixe", "ingleses" ~ "ingles".
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
    const encontrados = tokens(
        candidato.name || candidato.address_line1 || ""
    );

    if (encontrados.length === 0) return 0;

    const buscadosOriginais = tokens(nomeBuscado);

    // Compara conjuntos de tipos. Se o resultado tem um tipo
    // (museu, rua, hotel, praia...) que o nome buscado NÃO tem, é outro lugar.
    const tiposBuscados = new Set<string>(
        buscadosOriginais.filter((t) => TIPOS_ESTRUTURAIS.has(t))
    );

    if (
        encontrados.some(
            (t) => TIPOS_ESTRUTURAIS.has(t) && !tiposBuscados.has(t)
        )
    ) {
        return 0;
    }

    let buscados = tokens(nomeBuscado, ignorar).filter(
        (t) => !TERMOS_GENERICOS.has(t)
    );

    if (buscados.length === 0) {
        buscados = buscadosOriginais.filter((t) => !TERMOS_GENERICOS.has(t));
    }

    if (buscados.length === 0) return 0;

    const acertos = buscados.filter((b) =>
        encontrados.some((e) => tokenIgual(b, e))
    );

    const score = acertos.length / buscados.length;

    // Correspondência fraca contra um nome longo não é confiável.
    if (buscados.length === 1 && encontrados.length > 3) {
        return Math.min(score, 0.4);
    }

    if (acertos.length < buscados.length) {
        // Parcial contra nome muito longo: rejeita.
        if (encontrados.length > 5) return Math.min(score, 0.4);
        // Parcial normal: no máximo "aproximado", nunca "confirmado".
        return Math.min(score, LIMIAR_CONFIRMADO - 0.05);
    }

    return score;
}

function categoriaCompativel(
    tipoLocal: string,
    categoria: string | undefined
): boolean {
    // Geocode, Nominatim e Photon não devolvem categoria: não dá para validar
    // por aqui, então aceita (o nome e o filtro de tipo já validam).
    if (!categoria) return true;

    const cat = categoria.toLowerCase();

    const ehComida =
        cat.includes("catering.") || cat.includes("commercial.food_and_drink");
    const ehHospedagem = cat.includes("accommodation.");

    if (tipoLocal === "restaurante") return ehComida;

    if (tipoLocal === "hospedagem") return ehHospedagem;

    // Atração: só rejeita o que é claramente comida ou hospedagem.
    if (tipoLocal === "atracao") return !ehComida && !ehHospedagem;

    return true;
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

    const menor = ta.length <= tb.length ? ta : tb;
    const maior = ta.length <= tb.length ? tb : ta;

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
                duplicado.dias = Array.from(
                    new Set([...(duplicado.dias ?? []), ...(r.dias ?? [])])
                );
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
    const ignorar = new Set<string>([...tokens(destino), "brasil", "brazil"]);

    // Descarta registos sem nome e junta repetidos (mesmo local em vários
    // dias passa a um só, com a lista de dias em "dias").
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

    const locais: any[] = Array.from(porNome.values());

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

        // --- Fontes de pesquisa ---
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
                categoria: Array.isArray(f.properties?.categories)
                    ? f.properties.categories.join(",")
                    : "",
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

        // Nominatim: no máximo 1 pedido por segundo.
        let ultimaNominatim = 0;
        let nominatimBloqueado = false;

        const buscarNominatim = async (q: string): Promise<Candidato[]> => {
            if (nominatimBloqueado) return [];

            const espera = 1100 - (Date.now() - ultimaNominatim);
            if (espera > 0) await new Promise((r) => setTimeout(r, espera));
            ultimaNominatim = Date.now();

            const d = 0.5; // ~55 km em volta do centro
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

        // Photon: terceira fonte de busca de coordenadas.
        const buscarPhoton = async (q: string): Promise<Candidato[]> => {
            const parametros = new URLSearchParams({
                q,
                limit: "5",
            });

            const dados = await getJson(
                `https://photon.komoot.io/api/?${parametros}`
            );

            return (dados.features ?? []).map((feature: any) => {
                const propriedades = feature.properties ?? {};
                const coordenadas = feature.geometry?.coordinates ?? [];

                const lon = Number(coordenadas[0]);
                const lat = Number(coordenadas[1]);

                const partesEndereco = [
                    propriedades.name,
                    propriedades.street,
                    propriedades.district,
                    propriedades.city || propriedades.county,
                    propriedades.state,
                    propriedades.country,
                ].filter(Boolean);

                return {
                    name: propriedades.name,
                    formatted: partesEndereco.join(", "),
                    suburb: propriedades.district,
                    district: propriedades.district,
                    city: propriedades.city || propriedades.county,
                    lat,
                    lon,
                };
            });
        };

        // --- Resolução de cada local ---
        const resolver = async (local: any) => {
            const nomes: string[] = Array.from(
                new Set<string>(
                    [
                        ...variantesDoNome(local.nome),
                        ...(Array.isArray(local.nomes_alternativos)
                            ? local.nomes_alternativos
                                .filter((n: unknown) => typeof n === "string")
                                .map(limparNome)
                            : []),
                    ].filter(
                        (n): n is string =>
                            typeof n === "string" && n.trim().length > 0
                    )
                )
            );

            // Bairro sugerido pela IA: serve apenas de desempate, nunca rejeita.
            const bairros = tokens(local.bairro, ignorar);

            const estado: {
                melhor: { c: Candidato; score: number; rank: number } | null;
            } = { melhor: null };

            // Candidatos que a pesquisa devolveu (para diagnóstico no log).
            const vistos: string[] = [];

            const avaliar = (candidatos: Candidato[]) => {
                for (const c of candidatos) {
                    if (!ehNumero(c.lat) || !ehNumero(c.lon)) continue;

                    vistos.push(
                        `${c.name ?? c.formatted} (${Math.round(
                            distanciaMetros(centro, c) / 1000
                        )} km)`
                    );

                    if (!dentroDoRaio(c)) continue;

                    // Confere se a categoria encontrada combina com o tipo solicitado.
                    if (!categoriaCompativel(local.tipo, c.categoria)) continue;

                    let score = Math.max(
                        ...nomes.map((n) => pontuarNome(n, c, ignorar))
                    );

                    if (score <= 0) continue;

                    // Restaurante/hospedagem sem categoria pode ser um bairro ou
                    // rua com o mesmo nome: no máximo "aproximado".
                    if (
                        !c.categoria &&
                        (local.tipo === "restaurante" || local.tipo === "hospedagem") &&
                        tokens(local.nome, ignorar).filter(
                            (t) => !TERMOS_GENERICOS.has(t)
                        ).length < 2
                    ) {
                        score = Math.min(score, LIMIAR_CONFIRMADO - 0.05);
                    }

                    // Evita aceitar um resultado genérico como se fosse o estabelecimento procurado.
                    const nomeCandidato = tokens(c.name ?? "");

                    const candidatoGenerico =
                        nomeCandidato.length === 0 ||
                        (nomeCandidato.length === 1 &&
                            NOMES_GENERICOS_UNICOS.includes(nomeCandidato[0]));

                    if (candidatoGenerico && score < LIMIAR_CONFIRMADO) continue;

                    const textoRegiao = tokens(
                        `${c.formatted ?? ""} ${c.suburb ?? ""} ${c.district ?? ""}`
                    );
                    const bonus = bairros.some((b) =>
                        textoRegiao.some((t) => tokenIgual(b, t))
                    )
                        ? 0.05
                        : 0;

                    // Desempate: entre scores iguais, prefere o nome mais curto.
                    const rank = score + bonus - nomeCandidato.length * 0.001;

                    const atual = estado.melhor;
                    if (!atual || rank > atual.rank) {
                        estado.melhor = { c, score, rank };
                    }
                }
            };

            const etapas: (() => Promise<Candidato[]>)[] = [
                // 1. Geoapify Places
                ...nomes.map(
                    (n) => () => buscarPlaces(n, local.tipo === "hospedagem")
                ),

                // 2. Geoapify Geocoding
                ...nomes.map((n) => () => buscarGeocode(`${n}, ${nomeCidade}`)),

                // 3. Nominatim
                ...nomes
                    .slice(0, 2)
                    .map((n) => () => buscarNominatim(`${n}, ${destino}, Brasil`)),

                // 4. Photon
                ...nomes
                    .slice(0, 2)
                    .map((n) => () => buscarPhoton(`${n}, ${destino}, Brasil`)),
            ];

            for (const etapa of etapas) {
                const atual = estado.melhor;
                if (atual && atual.score >= LIMIAR_CONFIRMADO) {
                    break;
                }
                try {
                    avaliar(await etapa());
                } catch (error) {
                    console.warn("Falha numa etapa de pesquisa:", local.nome, error);
                }
            }

            const achado = estado.melhor as
                | { c: Candidato; score: number; rank: number }
                | null;

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

            // Nada fiável na região: só agora procura noutras cidades.
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
                        console.warn("Falha ao pesquisar noutra cidade:", nome, error);
                    }
                }
            }

            console.warn("NÃO ENCONTRADO:", local.nome, {
                nomesPesquisados: nomes,
                candidatosVistos: vistos.slice(0, 10),
                melhorPontuacao: achado?.score ?? null,
            });

            return naoEncontrado(local);
        };

        const resultados: any[] = [];

        for (const local of locais) {
            try {
                const r: any = await resolver(local);
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

        // Locais de nomes diferentes na mesma coordenada: o segundo é
        // rebaixado para "aproximado" e o frontend recebe um aviso.
        const coordenadas = new Map<string, any>();
        for (const r of resultados) {
            if (!ehNumero(r.latitude) || !ehNumero(r.longitude)) continue;

            const chave = `${r.latitude.toFixed(5)},${r.longitude.toFixed(5)}`;
            const anterior = coordenadas.get(chave);

            if (!anterior) {
                coordenadas.set(chave, r);
                continue;
            }

            if (!nomesSemelhantes(anterior.nome, r.nome)) {
                console.warn("COORDENADAS REPETIDAS:", anterior.nome, "e", r.nome);
                r.status = "aproximado";
                r.aviso = `A localização de "${r.nome}" coincide com a de "${anterior.nome}" e pode estar imprecisa.`;
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
// LUGARES REAIS DO DESTINO (Geoapify Places + Wikipédia)
// ======================================================
const MAX_PONTOS_NO_PROMPT = 35;

type TipoPonto = "atracao" | "restaurante" | "hospedagem";

type PontoInteressante = {
    id: string;
    nome: string;
    tipo: TipoPonto;
    categoria: string;
    endereco: string;
    lat: number;
    lon: number;
    pontuacao: number;
    distKm: number;
};

type DestinoFinanceiro = {
    municipio: string;
    estado: string | null;
    pais: string;
    codigoPais: string;
};

type PontoSemId = Omit<PontoInteressante, "id">;

async function buscarPontosInteressantes(
    destino: string
): Promise<{
    pontos: PontoInteressante[];
    destinoFinanceiro: DestinoFinanceiro | null;
}> {
    const geoKey = process.env.GEOAPIFY_API_KEY;

    if (!geoKey) {
        console.warn("PONTOS DE INTERESSE desativados (falta GEOAPIFY_API_KEY).");
        return {
            pontos: [],
            destinoFinanceiro: null,
        };
    }

    try {
        // Identifica dinamicamente o centro do destino informado pelo usuário.
        const dadosCidade = await getJson(
            `https://api.geoapify.com/v1/geocode/search?${new URLSearchParams({
                text: destino,
                type: "city",
                format: "json",
                limit: "5",
                lang: "pt",
                apiKey: geoKey,
            })}`
        );

        const resultadosCidade: any[] = Array.isArray(dadosCidade.results)
            ? dadosCidade.results
            : [];

        const nomeDestino = normalizarTexto(destino.split(",")[0]);
        const cidade =
            resultadosCidade.find(
                (r: any) =>
                    ehNumero(r.lat) &&
                    ehNumero(r.lon) &&
                    normalizarTexto(r.city || r.name) === nomeDestino
            ) ??
            resultadosCidade.find(
                (r: any) => ehNumero(r.lat) && ehNumero(r.lon)
            );

        if (!cidade) {
            console.warn("Não foi possível identificar o centro do destino:", destino);
            return {
                pontos: [],
                destinoFinanceiro: null,
            };
        }

        const centro = { lat: Number(cidade.lat), lon: Number(cidade.lon) };
        const destinoFinanceiro: DestinoFinanceiro = {
            municipio: cidade.city || cidade.name || destino.split(",")[0].trim(),
            estado: cidade.state || null,
            pais: cidade.country || "",
            codigoPais: String(cidade.country_code || "").toUpperCase(),
        };
        const filtro = `circle:${centro.lon},${centro.lat},${RAIO_METROS}`;
        const proximidade = `proximity:${centro.lon},${centro.lat}`;

        // Cada grupo é pesquisado separadamente para manter a categoria correta.
        const grupos: {
            tipo: TipoPonto;
            categorias: string;
            limite: number;
        }[] = [
                {
                    tipo: "atracao",
                    categorias:
                        "tourism,heritage,entertainment,beach,natural,leisure,religion",
                    limite: 18,
                },
                {
                    tipo: "restaurante",
                    categorias:
                        "catering.restaurant,catering.cafe,catering.bar,catering.fast_food,catering.food_court,catering.pub",
                    limite: 12,
                },
                {
                    tipo: "hospedagem",
                    categorias: "accommodation",
                    limite: 5,
                },
            ];

        const respostas = await Promise.allSettled(
            grupos.map(async (grupo) => {
                const dados = await getJson(
                    `https://api.geoapify.com/v2/places?${new URLSearchParams({
                        categories: grupo.categorias,
                        filter: filtro,
                        bias: proximidade,
                        limit: "100",
                        lang: "pt",
                        apiKey: geoKey,
                    })}`
                );

                return {
                    grupo,
                    features: Array.isArray(dados?.features) ? dados.features : [],
                };
            })
        );

        const resultadosPorGrupo: {
            tipo: TipoPonto;
            limite: number;
            features: any[];
        }[] = [];

        respostas.forEach((resposta, indice) => {
            if (resposta.status === "fulfilled") {
                resultadosPorGrupo.push({
                    tipo: resposta.value.grupo.tipo,
                    limite: resposta.value.grupo.limite,
                    features: resposta.value.features,
                });
            } else {
                console.warn(
                    `Falha ao pesquisar categoria ${grupos[indice].tipo}:`,
                    resposta.reason
                );
            }
        });

        // A Wikipédia é apenas um sinal adicional de relevância turística.
        let artigos: { titulo: string; lat: number; lon: number }[] = [];

        try {
            const respostasWiki = await Promise.allSettled(
                ["https://pt.wikipedia.org/w/api.php", "https://en.wikipedia.org/w/api.php"].map(
                    async (baseUrl) => {
                        const dados = await getJson(
                            `${baseUrl}?${new URLSearchParams({
                                action: "query",
                                list: "geosearch",
                                gscoord: `${centro.lat}|${centro.lon}`,
                                gsradius: "10000",
                                gslimit: "50",
                                format: "json",
                                origin: "*",
                            })}`,
                            { "User-Agent": "TripIA/1.0" }
                        );

                        return (dados?.query?.geosearch ?? []).map((a: any) => ({
                            titulo: String(a.title ?? ""),
                            lat: Number(a.lat),
                            lon: Number(a.lon),
                        }));
                    }
                )
            );

            artigos = respostasWiki.flatMap((r) =>
                r.status === "fulfilled" ? r.value : []
            );
        } catch (error) {
            console.warn("Wikipédia indisponível, seguindo sem ela:", error);
        }

        const candidatos: PontoSemId[] = [];

        for (const grupo of resultadosPorGrupo) {
            const doGrupo: PontoSemId[] = [];

            for (const feature of grupo.features) {
                const p = feature?.properties ?? {};
                const nome = typeof p.name === "string" ? limparNome(p.name) : "";
                const lat = Number(p.lat);
                const lon = Number(p.lon);

                if (!nome || !ehNumero(lat) || !ehNumero(lon)) continue;

                const pos = { lat, lon };
                const categorias = Array.isArray(p.categories)
                    ? p.categories.join(",")
                    : "";
                const raw = p.datasource?.raw ?? {};
                const temWiki = Boolean(raw.wikidata || raw.wikipedia);
                const naWikipedia = artigos.some(
                    (artigo) =>
                        ehNumero(artigo.lat) &&
                        ehNumero(artigo.lon) &&
                        distanciaMetros(pos, artigo) <= 500 &&
                        nomesSemelhantes(nome, artigo.titulo)
                );

                const categoriaTuristica =
                    /tourism\.|heritage|entertainment\.|beach|natural\.|leisure\.|religion\./i.test(
                        categorias
                    );

                // Atrações recebem um filtro de relevância turística.
                // Restaurantes e hospedagens são mantidos se tiverem nome
                // e coordenadas válidas; não inventamos avaliações ou rankings.
                const pontuacao =
                    (temWiki ? 3 : 0) +
                    (naWikipedia ? 2 : 0) +
                    (categoriaTuristica ? 2 : 0);

                if (grupo.tipo === "atracao" && pontuacao < 2) continue;

                doGrupo.push({
                    nome,
                    tipo: grupo.tipo,
                    categoria: categorias,
                    endereco: String(p.formatted ?? p.address_line1 ?? ""),
                    lat,
                    lon,
                    pontuacao,
                    distKm: Number(
                        (distanciaMetros(centro, pos) / 1000).toFixed(1)
                    ),
                });
            }

            doGrupo.sort((a, b) => {
                if (grupo.tipo === "atracao" && b.pontuacao !== a.pontuacao) {
                    return b.pontuacao - a.pontuacao;
                }

                // Para estabelecimentos sem dados públicos de popularidade,
                // proximidade é usada apenas como critério de ordenação.
                return a.distKm - b.distKm;
            });

            // Remove duplicados do mesmo grupo por nome e proximidade.
            const unicosGrupo: PontoSemId[] = [];

            for (const ponto of doGrupo) {
                const duplicado = unicosGrupo.some(
                    (existente) =>
                        nomesSemelhantes(existente.nome, ponto.nome) &&
                        distanciaMetros(existente, ponto) <= 60
                );

                if (!duplicado) unicosGrupo.push(ponto);
                if (unicosGrupo.length >= grupo.limite) break;
            }

            candidatos.push(...unicosGrupo);
        }

        // IDs únicos compartilhados com a IA.
        const pontos: PontoInteressante[] = candidatos
            .slice(0, MAX_PONTOS_NO_PROMPT)
            .map((ponto, indice) => ({
                ...ponto,
                id: `p${indice + 1}`,
            }));

        console.log("PONTOS DE INTERESSE POR CATEGORIA:", {
            destino,
            centro,
            total: pontos.length,
            atracoes: pontos.filter((p) => p.tipo === "atracao").length,
            restaurantes: pontos.filter((p) => p.tipo === "restaurante").length,
            hospedagens: pontos.filter((p) => p.tipo === "hospedagem").length,
            locais: pontos.map(
                (p) =>
                    `${p.id} | ${p.tipo} | ${p.nome} | ${p.distKm} km`
            ),
        });

        return {
            pontos,
            destinoFinanceiro,
        };
    } catch (error) {
        console.warn("Falha ao buscar pontos de interesse:", error);
        return {
            pontos: [],
            destinoFinanceiro: null,
        };
    }
}

// ======================================================
// DATAS DA VIAGEM
// ======================================================
// Gera todas as datas (YYYY-MM-DD) de ida até volta, inclusive.
function gerarDatas(ida: string, volta: string): string[] | null {
    const inicio = new Date(`${String(ida).slice(0, 10)}T12:00:00Z`);
    const fim = new Date(`${String(volta).slice(0, 10)}T12:00:00Z`);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
        return null;
    }

    if (fim < inicio) return null;

    const datas: string[] = [];
    const atual = new Date(inicio);

    while (atual <= fim && datas.length <= 60) {
        datas.push(atual.toISOString().slice(0, 10));
        atual.setUTCDate(atual.getUTCDate() + 1);
    }

    return datas;
}

// ======================================================
// MONTAGEM DO MARKDOWN (feita no código, não pela IA)
// ======================================================
function texto(valor: unknown): string {
    return typeof valor === "string" ? valor.trim() : "";
}

function formatarData(data: string): string {
    const m = texto(data).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : texto(data);
}

function montarMarkdown(
    resultado: any,
    info: { destino: string; origem: string; ida: string; volta: string; viajantes: number }
): string {
    const dias: any[] = Array.isArray(resultado.dias) ? resultado.dias : [];
    const gastos = resultado.gastos ?? {};
    const dicas: any[] = Array.isArray(resultado.dicas) ? resultado.dicas : [];
    const partes: string[] = [];

    // Apresentação
    partes.push(
        `# Apresentação da viagem\n\n` +
        `${texto(resultado.apresentacao) || `Roteiro para ${info.destino}.`}\n\n` +
        `- **Origem:** ${info.origem}\n` +
        `- **Destino:** ${info.destino}\n` +
        `- **Período:** ${formatarData(info.ida)} a ${formatarData(info.volta)}\n` +
        `- **Viajantes:** ${info.viajantes}`
    );

    // Resumo do destino
    if (texto(resultado.resumo_destino)) {
        partes.push(`# Resumo do destino\n\n${texto(resultado.resumo_destino)}`);
    }

    // Roteiro por dia
    const blocosDias = dias.map((d) => {
        const atividades: any[] = Array.isArray(d.atividades) ? d.atividades : [];
        const gastronomia: any[] = Array.isArray(d.gastronomia) ? d.gastronomia : [];

        let bloco = `### Dia ${d.dia ?? ""} — ${formatarData(d.data)}\n`;

        if (texto(d.resumo)) bloco += `\n${texto(d.resumo)}\n`;

        if (atividades.length) {
            bloco +=
                "\n" +
                atividades
                    .map(
                        (a) =>
                            `- **${texto(a.periodo)}:** ${texto(a.titulo)}` +
                            (texto(a.descricao) ? ` — ${texto(a.descricao)}` : "")
                    )
                    .join("\n") +
                "\n";
        }

        if (gastronomia.length) {
            bloco +=
                "\n" +
                gastronomia
                    .map(
                        (g) =>
                            `- ${texto(g.icone) || "🍽️"} **${texto(g.periodo)}:** ${texto(g.titulo)}` +
                            (texto(g.local) ? ` (${texto(g.local)})` : "") +
                            (texto(g.descricao) ? ` — ${texto(g.descricao)}` : "")
                    )
                    .join("\n") +
                "\n";
        }

        return bloco;
    });

    partes.push(`# Roteiro separado por dia\n\n${blocosDias.join("\n")}`);

    // Atrações e atividades sugeridas
    const atracoes: string[] = Array.from(
        new Set<string>(
            dias.flatMap((d) =>
                (Array.isArray(d.atividades) ? d.atividades : [])
                    .map((a: any) => texto(a.titulo))
                    .filter(Boolean)
            )
        )
    );

    if (atracoes.length) {
        partes.push(
            `# Atrações e atividades sugeridas\n\n` +
            atracoes.map((a) => `- ${a}`).join("\n")
        );
    }

    // Sugestões gastronómicas
    const comidas: string[] = Array.from(
        new Set<string>(
            dias.flatMap((d) =>
                (Array.isArray(d.gastronomia) ? d.gastronomia : [])
                    .map((g: any) =>
                        [
                            texto(g.titulo),
                            texto(g.local) && `(${texto(g.local)})`,
                            texto(g.descricao) && `— ${texto(g.descricao)}`,
                        ]
                            .filter(Boolean)
                            .join(" ")
                    )
                    .filter(Boolean)
            )
        )
    );

    if (comidas.length) {
        partes.push(
            `# Sugestões gastronômicas\n\n` +
            comidas.map((c) => `- ${c}`).join("\n")
        );
    }

    // Estimativa de despesas
    const linhasGastos = [
        ["Transporte", gastos.transporte],
        ["Alojamento", gastos.hospedagem],
        ["Alimentação", gastos.alimentacao],
        ["Passeios", gastos.passeios],
    ]
        .filter(([, v]) => texto(v))
        .map(([k, v]) => `- ${k}: **${texto(v)}**`);

    if (linhasGastos.length || texto(gastos.total)) {
        partes.push(
            `# Estimativa de gastos\n\n` +
            [
                ...linhasGastos,
                texto(gastos.total) && `- **TOTAL ESTIMADO: ${texto(gastos.total)}**`,
                texto(gastos.porPessoa) && `- Por pessoa: **${texto(gastos.porPessoa)}**`,
            ]
                .filter(Boolean)
                .join("\n") +
            `\n\n*Valores aproximados, sujeitos a variação.*`
        );
    }

    // Dicas importantes
    const listaDicas = dicas.map(texto).filter(Boolean);

    if (listaDicas.length) {
        partes.push(
            `# Dicas importantes\n\n` + listaDicas.map((d) => `- ${d}`).join("\n")
        );
    }

    return partes.join("\n\n");
}

// ======================================================
// INTERPRETAÇÃO DA RESPOSTA DA IA
// ======================================================
function interpretarResposta(textoBruto: string) {
    const jsonLimpo = textoBruto
        .replace(/^\uFEFF/, "")
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    try {
        return JSON.parse(jsonLimpo);
    } catch (error) {
        console.error("JSON inválido devolvido pela IA.");

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
            "A IA devolveu um JSON inválido. Tente gerar o roteiro novamente."
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
                { erro: "Preencha origem, destino e datas da viagem." },
                { status: 400 }
            );
        }

        // Validar restantes informações.
        if (
            !Array.isArray(preferencias) ||
            !Number.isInteger(Number(viajantes)) ||
            Number(viajantes) < 1 ||
            Number(viajantes) > 8 ||
            (orcamento !== null &&
                orcamento !== undefined &&
                orcamento !== "" &&
                (!Number.isFinite(Number(orcamento)) || Number(orcamento) < 0))
        ) {
            return NextResponse.json(
                { erro: "Algumas informações da viagem são inválidas." },
                { status: 400 }
            );
        }

        // Datas de cada dia da viagem (calculadas aqui, não pela IA).
        const datas = gerarDatas(ida, volta);

        if (!datas) {
            return NextResponse.json(
                { erro: "As datas da viagem são inválidas. A volta deve ser igual ou posterior à ida." },
                { status: 400 }
            );
        }

        if (datas.length > MAX_DIAS) {
            return NextResponse.json(
                {
                    erro: `Por enquanto o roteiro aceita até ${MAX_DIAS} dias. A sua viagem tem ${datas.length} dias.`,
                },
                { status: 400 }
            );
        }

        const groqApiKey = process.env.GROQ_API_KEY;

        if (!groqApiKey) {
            throw new Error("GROQ_API_KEY não encontrada no .env.local.");
        }

        const groq = new Groq({ apiKey: groqApiKey });

        // ==================================================
        // PROMPT DO TRIPIA (enxuto)
        // ==================================================
        const listaDatas = datas.map((d, i) => `Dia ${i + 1} = ${d}`).join("; ");

        // Lugares reais e populares do destino (a IA escolhe entre eles).
        const dadosDestino = await buscarPontosInteressantes(destino);

        const pontos = dadosDestino.pontos;
        const destinoFinanceiro = dadosDestino.destinoFinanceiro;

        const localizacaoFinanceira = destinoFinanceiro
            ? await criarLocalizacaoFinanceiraUniversal(destinoFinanceiro)
            : null;

        const dadosPrecos = localizacaoFinanceira
            ? await criarDadosPrecosEstimados(localizacaoFinanceira)
            : null;

        const dadosCombustivel = localizacaoFinanceira
            ? await buscarPrecoCombustivel(localizacaoFinanceira.codigoPais)
            : null;

        const mapaPontos = new Map<string, PontoInteressante>(
            pontos.map((p): [string, PontoInteressante] => [p.id, p])
        );

        const pontosAtracoes = pontos.filter((p) => p.tipo === "atracao");
        const pontosGastronomia = pontos.filter((p) => p.tipo === "restaurante");
        const pontosHospedagem = pontos.filter((p) => p.tipo === "hospedagem");

        const blocoLista =
            pontos.length > 0
                ? `
LUGARES REAIS ENCONTRADOS PELA API (use os IDs exatamente como recebidos):

ATRAÇÕES TURÍSTICAS (id | nome | distância do centro):
${pontosAtracoes.map((p) => `${p.id} | ${p.nome} | ${p.distKm} km`).join("\n") || "Nenhuma atração encontrada."}

RESTAURANTES, BARES E CAFÉS (id | nome | distância do centro):
${pontosGastronomia.map((p) => `${p.id} | ${p.nome} | ${p.distKm} km`).join("\n") || "Nenhum estabelecimento gastronômico encontrado."}

HOSPEDAGENS (id | nome | distância do centro):
${pontosHospedagem.map((p) => `${p.id} | ${p.nome} | ${p.distKm} km`).join("\n") || "Nenhuma hospedagem encontrada."}

REGRAS DE USO DA LISTA:
- Use os locais da categoria correta. Não trate restaurante ou hotel como atração turística.
- Para cada atração escolhida, use o mesmo nome e ID da lista em "atividades" e "locais".
- Para cada restaurante/ bar escolhido em "gastronomia", use o nome exato em "local" e o ID em "local_id"; inclua também esse estabelecimento em "locais", com o mesmo ID e tipo "restaurante".
- Se escolher hospedagens, inclua no máximo 3 em "locais", com o mesmo ID e tipo "hospedagem". Não as transforme em atividades do dia.
- Priorize lugares relevantes para as preferências e duração da viagem; agrupe atrações próximas no mesmo dia.
- Não invente nomes, endereços, avaliações, horários ou coordenadas. Não acrescente atrações ou estabelecimentos que não estejam na lista.
- Locais específicos pedidos pelo usuário nas observações podem ser incluídos mesmo sem ID; deixe o ID vazio e o backend tentará localizá-los.
`
                : `
A API não retornou lugares cadastrados para este destino. Não invente atrações, restaurantes, hospedagens ou coordenadas. Sugira apenas atividades genéricas que não afirmem a existência de um estabelecimento específico. Locais explicitamente solicitados pelo usuário podem ser incluídos em "locais" com ID vazio para tentativa de geocodificação.
`;

        const prompt = `Crie um roteiro de viagem realista e organizado.

DADOS:
Origem: ${origem}
Destino: ${destino}
Dias: ${listaDatas}
Viajantes: ${viajantes}
Transporte: ${transporte || "Não informado"}
Preferências: ${preferencias.join(", ") || "Não informadas"}
Orçamento: ${orcamento ? `R$ ${orcamento}` : "Não informado"}
Observações: ${observacoes || "Nenhuma"}
${blocoLista}
REGRAS:
- Gere exatamente ${datas.length} dias, usando as datas informadas acima.
- Por dia, procure selecionar de 3 a 5 atrações turísticas reais da lista da API, quando houver opções adequadas. As atividades devem ser distribuídas entre manhã, tarde e noite, sem obrigar três períodos se não fizer sentido.
- Aproveite as atrações relevantes disponíveis na lista da API ao longo de todos os dias, evitando deixar opções adequadas de fora sem motivo.
- Não concentre todas as atrações em um único dia. Distribua os locais considerando proximidade geográfica, tempo de visita e deslocamento.
- Não repita atrações em dias diferentes, salvo quando houver justificativa.
- Mantenha no máximo 1 sugestão gastronômica para almoço e 1 para jantar por dia.
- Não adicione atividades apenas para atingir uma quantidade. Priorize qualidade, viabilidade e coerência do roteiro.
- Agrupe locais próximos. Use os lugares reais da lista da API. Não invente estabelecimentos, endereços, horários, avaliações, preços ou coordenadas.
- Respeite todos os locais pedidos nas observações, reconhecendo apelidos e variações de escrita.
- GASTRONOMIA REGIONAL: priorize pratos, comidas, ingredientes e preparos tradicionalmente associados ao destino ou à região. Evite sugestões genéricas que poderiam existir em qualquer cidade.
- Em cada item de "gastronomia", use "titulo" para o nome de um prato ou comida regional específica; em "descricao", explique brevemente o que é e a sua relação com a culinária local. Não use apenas o nome de um restaurante como título.
- Preencha "local" e "local_id" somente com um restaurante/ bar da lista da API que seja adequado; use o nome e ID exatos. Caso contrário, deixe ambos vazios; nunca invente estabelecimentos.
- Não afirme que uma comida é típica do destino se essa relação for incerta. Se for uma tradição da região mais ampla, deixe isso claro na descrição.
- Distribua sugestões adequadas entre almoço e jantar, respeitando no máximo 1 item de cada período por dia.
- Mercados e frutos do mar no almoço; restaurantes sofisticados no jantar; praias, museus e passeios ao ar livre de manhã ou tarde; orlas e pôr do sol no fim da tarde; feiras, bares e música à noite.
- Todas as descrições devem ter no máximo uma frase curta.
- "locais": cada local escolhido aparece uma única vez, com "id" igual ao ID da API (ou vazio se foi explicitamente solicitado e não está na lista), "tipo" = atracao, restaurante ou hospedagem. "bairro": preencha sempre que souber; "nomes_alternativos" é lista (ou []).
- Em "locais", inclua SOMENTE lugares com nome próprio que realmente existam. Nunca use nomes genéricos ou inventados como "Bar da Praia", "Restaurante X" ou nomes de estabelecimentos sem confirmação. Se não houver um local real adequado, deixe o campo "local" vazio e não crie um item em "locais". Todo estabelecimento preenchido em "gastronomia.local" deve aparecer também em "locais", com "tipo" = restaurante e o mesmo ID.
- Se houver hospedagens na lista, selecione até 3 opções adequadas ao destino e orçamento e inclua-as em "locais" com "tipo" = hospedagem, sem associá-las a um dia ou atividade.
- Não inclua em "locais" destinos fora da região metropolitana de ${destino} (a menos de 50 km).
- "gastos": estimativas em R$ (texto curto, ex.: "R$ 800 a R$ 1.200"), sem valores exatos inventados.
- "gastos.porDia": informe uma estimativa para CADA dia do roteiro, com as mesmas categorias e total diário; use faixas em R$ e considere transporte, hospedagem, alimentação e passeios daquele dia. Não divida o total igualmente entre os dias: estime conforme a programação. Se uma categoria não gerar custo, use "R$ 0".
- "dicas": no máximo 5 itens curtos.

Responda SOMENTE com JSON válido neste formato:
{
  "apresentacao": "2 frases sobre a viagem.",
  "resumo_destino": "2 frases sobre o destino.",
  "dias": [
    {
      "dia": 1,
      "data": "YYYY-MM-DD",
      "resumo": "Frase curta.",
      "atividades": [
        { "periodo": "manhã", "titulo": "Nome", "descricao": "Frase curta.", "local": "Nome do local" }
      ],
      "gastronomia": [
        { "titulo": "Nome do prato típico", "descricao": "O que é e sua relação com a culinária regional.", "icone": "🍽️", "periodo": "almoço", "local": "Nome exato de um estabelecimento da lista ou vazio", "local_id": "ID do estabelecimento ou vazio" }
      ]
    }
  ],
  "locais": [
    { "id": "ID da lista ou vazio", "nome": "Nome real", "bairro": "", "nomes_alternativos": [], "tipo": "atracao", "dia": 1, "periodo": "manhã" }
  ],
  "gastos": {
    "transporte": "", "hospedagem": "", "alimentacao": "", "passeios": "",
    "total": "", "porPessoa": "",
    "porDia": [
      {
        "dia": 1,
        "transporte": "",
        "hospedagem": "",
        "alimentacao": "",
        "passeios": "",
        "total": "",
        "porPessoa": ""
      }
    ]
  },
  "dicas": ["Dica curta."]
}`;

        // ==================================================
        // PEDIDO AO GROQ
        // ==================================================
        console.log("A iniciar geração de roteiro com Groq...");

        const respostaGroq: any = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
                {
                    role: "system",
                    content:
                        "Você é o assistente de viagens oficial do TripIA. " +
                        "Siga as instruções e devolva exclusivamente JSON válido.",
                },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            // Modelo de raciocínio: limita os tokens gastos a "pensar",
            // caso contrário consomem o max_completion_tokens e o JSON não termina.
            reasoning_effort: "low",
            max_completion_tokens: MAX_TOKENS_SAIDA,
        } as any, {
            signal: request.signal,
        });

        console.log("Resposta recebida do Groq.");

        const escolha = respostaGroq?.choices?.[0];

        if (escolha?.finish_reason === "length") {
            throw new Error("RESPOSTA_CORTADA");
        }

        const conteudo = escolha?.message?.content;

        if (typeof conteudo !== "string" || !conteudo.trim()) {
            throw new Error("O Groq devolveu uma resposta vazia.");
        }

        const resultado = interpretarResposta(conteudo);

        console.log("ESTRUTURA DEVOLVIDA PELA IA:", {
            dias: Array.isArray(resultado?.dias),
            locais: Array.isArray(resultado?.locais),
            chaves: Object.keys(resultado ?? {}),
        });

        if (
            !resultado ||
            !Array.isArray(resultado.dias) ||
            resultado.dias.length === 0 ||
            !Array.isArray(resultado.locais)
        ) {
            throw new Error("A resposta da IA possui um formato inválido.");
        }

        // Garante a data correta de cada dia, mesmo que a IA erre.
        resultado.dias = resultado.dias.map((d: any, i: number) => ({
            ...d,
            dia: i + 1,
            data: datas[i] ?? d?.data,
            atividades: Array.isArray(d?.atividades) ? d.atividades : [],
            gastronomia: Array.isArray(d?.gastronomia) ? d.gastronomia : [],
        }));

        // Garante que restaurantes selecionados na gastronomia também sejam
        // enviados ao mapa, mesmo se a IA esquecer de repeti-los em "locais".
        resultado.locais = Array.isArray(resultado.locais) ? resultado.locais : [];

        for (const dia of resultado.dias) {
            for (const item of dia.gastronomia) {
                const id = typeof item?.local_id === "string"
                    ? item.local_id.trim()
                    : "";
                const nomeLocal = normalizarTexto(item?.local);

                // Usa o ID retornado pela IA; se ela omitir o ID, só associa
                // quando o nome for exatamente igual ao nome de um restaurante da API.
                const pontoPorId = id ? mapaPontos.get(id) : undefined;
                const ponto =
                    pontoPorId?.tipo === "restaurante"
                        ? pontoPorId
                        : pontos.find(
                            (p) =>
                                p.tipo === "restaurante" &&
                                nomeLocal &&
                                normalizarTexto(p.nome) === nomeLocal
                        );

                if (!ponto) continue;

                item.local = ponto.nome;
                item.local_id = ponto.id;

                const jaExiste = resultado.locais.some(
                    (local: any) =>
                        typeof local?.id === "string" &&
                        local.id.trim() === ponto.id
                );

                if (!jaExiste) {
                    resultado.locais.push({
                        id: ponto.id,
                        nome: ponto.nome,
                        tipo: "restaurante",
                        dia: dia.dia,
                        periodo: item.periodo,
                        bairro: "",
                        nomes_alternativos: [],
                    });
                }
            }
        }

        // Normaliza os custos gerais e diários para o frontend.
        const gastos = resultado.gastos ?? {};
        const gastosPorDia = Array.isArray(gastos.porDia) ? gastos.porDia : [];
        resultado.gastos = {
            transporte: String(gastos.transporte ?? "Não informado"),
            hospedagem: String(gastos.hospedagem ?? "Não informado"),
            alimentacao: String(gastos.alimentacao ?? "Não informado"),
            passeios: String(gastos.passeios ?? "Não informado"),
            total: String(gastos.total ?? "Não informado"),
            porPessoa: String(gastos.porPessoa ?? "Não informado"),
            porDia: resultado.dias.map((dia: any) => {
                const estimativa = gastosPorDia.find(
                    (item: any) => Number(item?.dia) === Number(dia.dia)
                ) ?? {};

                return {
                    dia: Number(dia.dia),
                    transporte: String(estimativa.transporte ?? "Não informado"),
                    hospedagem: String(estimativa.hospedagem ?? "Não informado"),
                    alimentacao: String(estimativa.alimentacao ?? "Não informado"),
                    passeios: String(estimativa.passeios ?? "Não informado"),
                    total: String(estimativa.total ?? "Não informado"),
                    porPessoa: String(estimativa.porPessoa ?? "Não informado"),
                };
            }),
        };

        const roteiro = montarMarkdown(resultado, {
            destino,
            origem,
            ida,
            volta,
            viajantes: Number(viajantes),
        });

        // ==================================================
        // GEOCODIFICAR LOCAIS
        // ==================================================
        // Locais escolhidos da lista já trazem coordenadas reais: sem geocodificação.
        const comId = new Map<string, any>();
        const semId: any[] = [];

        for (const l of resultado.locais) {
            const ponto =
                typeof l?.id === "string" ? mapaPontos.get(l.id.trim()) : undefined;

            if (!ponto) {
                // Descrições genéricas ("Barraca de frutos do mar na Praia do Futuro")
                // não são lugares: não adianta geocodificar.
                if (/^(barracas?|quiosques?)\s+(de|do|da)\s/i.test(String(l?.nome ?? "").trim())) {
                    continue;
                }
                semId.push(l);
                continue;
            }

            const dia = l?.dia;
            const existente = comId.get(ponto.id);

            if (existente) {
                if (dia != null && !existente.dias.includes(dia)) {
                    existente.dias.push(dia);
                }
                continue;
            }

            comId.set(ponto.id, {
                ...l,
                id: ponto.id,
                nome: ponto.nome,
                tipo: ponto.tipo,
                categoria: ponto.categoria,
                enderecoEncontrado: ponto.endereco,
                dias: dia != null ? [dia] : [],
                latitude: ponto.lat,
                longitude: ponto.lon,
                status: "confirmado" as StatusLocal,
            });
        }

        const locaisComId: any[] = Array.from(comId.values());

        console.log("LOCAIS ESCOLHIDOS DA LISTA:", {
            total: locaisComId.length,
            atracoes: locaisComId.filter((l: any) => l.tipo === "atracao").length,
            restaurantes: locaisComId.filter((l: any) => l.tipo === "restaurante").length,
            hospedagens: locaisComId.filter((l: any) => l.tipo === "hospedagem").length,
            locais: locaisComId.map((l: any) => ({
                id: l.id,
                nome: l.nome,
                tipo: l.tipo,
                latitude: l.latitude,
                longitude: l.longitude,
                endereco: l.enderecoEncontrado,
            })),
        });
        console.log(
            "LOCAIS FORA DA LISTA (geocodificação):",
            semId.map((l: any) => l?.nome)
        );

        // Restaurantes, hospedagens e atrações fora da lista seguem pela geocodificação.
        const geocodificadosSemId: any[] = semId.length
            ? await geocodificarLocais(semId, destino)
            : [];

        const locaisGeocodificados = ordenarLocais(
            mesclarDuplicados([...locaisComId, ...geocodificadosSemId])
        );

        console.log("DESTINO:", destino);

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
            roteiro,
            dias: resultado.dias,
            gastos: resultado.gastos,
            locais: locaisGeocodificados,
            avisos,
            localizacaoFinanceira,
            dadosPrecos,
            dadosCombustivel,
        });
    } catch (error) {
        console.error("Erro ao gerar roteiro:", error);

        const mensagem = error instanceof Error ? error.message : "";

        if (
            mensagem.includes("RESPOSTA_CORTADA") ||
            mensagem.includes("json_validate_failed") ||
            mensagem.includes("max completion tokens")
        ) {
            return NextResponse.json(
                {
                    erro: "O roteiro ficou demasiado grande para ser gerado de uma só vez. Tente com menos dias ou menos preferências.",
                },
                { status: 422 }
            );
        }

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
                    erro: "O limite de pedidos da IA foi atingido. Aguarde um minuto e tente novamente.",
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
                    erro: "A chave da IA é inválida ou não possui permissão para aceder à API.",
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