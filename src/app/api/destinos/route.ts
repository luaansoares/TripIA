
import { NextRequest, NextResponse } from "next/server";
import { buscarImagemAlternativa } from "@/services/imagens";

const categorias: Record<string, string> = {
    praias: "beaches",
    natureza: "natural",
    cultura: "cultural",
    gastronomia: "foods",
};

interface Atracao {
    xid: string;
    name?: string;
    dist?: number;
    kinds?: string;
    point?: {
        lon: number;
        lat: number;
    };
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const destino = searchParams.get("destino")?.trim();
        const categoria = searchParams.get("categoria")?.trim().toLowerCase();

        if (!destino || destino.length < 2) {
            return NextResponse.json(
                { erro: "Informe uma cidade ou destino válido." },
                { status: 400 }
            );
        }

        if (categoria && !categorias[categoria]) {
            return NextResponse.json(
                { erro: "Categoria não reconhecida." },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENTRIPMAP_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { erro: "Chave da OpenTripMap não configurada." },
                { status: 500 }
            );
        }

        // 1. Localiza a cidade
        const cidadeUrl = new URL(
            "https://api.opentripmap.com/0.1/en/places/geoname"
        );

        cidadeUrl.searchParams.set("name", destino);
        cidadeUrl.searchParams.set("apikey", apiKey);

        const cidadeResponse = await fetch(cidadeUrl.toString());

        if (!cidadeResponse.ok) {
            throw new Error("Não foi possível localizar o destino.");
        }

        const cidade = await cidadeResponse.json();

        if (
            cidade.status !== "OK" ||
            typeof cidade.lat !== "number" ||
            typeof cidade.lon !== "number"
        ) {
            return NextResponse.json(
                { erro: "Destino não encontrado. Tente informar outra cidade." },
                { status: 404 }
            );
        }

        // 2. Busca atrações próximas da cidade
        const atracoesUrl = new URL(
            "https://api.opentripmap.com/0.1/en/places/radius"
        );

        atracoesUrl.searchParams.set("radius", "10000");
        atracoesUrl.searchParams.set("lon", String(cidade.lon));
        atracoesUrl.searchParams.set("lat", String(cidade.lat));
        atracoesUrl.searchParams.set("limit", "50");
        atracoesUrl.searchParams.set("rate", "1");
        atracoesUrl.searchParams.set("format", "json");
        atracoesUrl.searchParams.set("apikey", apiKey);

        // Aplica categoria somente quando solicitada
        if (categoria) {
            atracoesUrl.searchParams.set(
                "kinds",
                categorias[categoria]
            );
        }

        const atracoesResponse = await fetch(atracoesUrl.toString());

        if (!atracoesResponse.ok) {
            throw new Error("Não foi possível buscar as atrações.");
        }

        const atracoes: Atracao[] = await atracoesResponse.json();

        // 3. Remove atrações duplicadas
        const atracoesUnicas = Array.from(
            new Map(
                atracoes.map((atracao) => {
                    const nome = (atracao.name || "")
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .toLowerCase()
                        .trim();

                    const latitude = atracao.point?.lat?.toFixed(3) || "";
                    const longitude = atracao.point?.lon?.toFixed(3) || "";

                    const chave = atracao.xid ||
                        `${nome}-${latitude}-${longitude}`;

                    return [chave, atracao];
                })
            ).values()
        );

        // 4. Ordena pelas atrações mais próximas
        atracoesUnicas.sort(
            (a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity)
        );

        // 5. Busca detalhes das atrações
        const atracoesDetalhadas = await Promise.all(
            atracoesUnicas.slice(0, 30).map(async (atracao) => {
                try {
                    const detalhesUrl = new URL(
                        `https://api.opentripmap.com/0.1/en/places/xid/${atracao.xid}`
                    );

                    detalhesUrl.searchParams.set("apikey", apiKey);

                    const resposta = await fetch(detalhesUrl.toString());

                    if (!resposta.ok) {
                        return atracao;
                    }

                    const detalhes = await resposta.json();

                    return {
                        ...atracao,
                        ...detalhes,
                        dist: atracao.dist,
                    };
                } catch {
                    return atracao;
                }
            })
        );


        // 6. Busca imagens alternativas usando Unsplash
        let limiteImagensAlternativas = 8;

        const atracoesComImagens = await Promise.all(
            atracoesDetalhadas.map(async (atracao) => {
                const imagemOriginal = atracao.preview?.source ?? "";

                // Verifica se a imagem original vem da Wikimedia
                const imagemWikimedia =
                    imagemOriginal.includes("wikimedia.org") ||
                    imagemOriginal.includes("wikipedia.org");

                // Mantém imagens originais de outras fontes
                if (imagemOriginal && !imagemWikimedia) {
                    return {
                        ...atracao,
                        imagemAlternativa: null,
                    };
                }

                // Limita a busca a 8 imagens alternativas
                if (limiteImagensAlternativas <= 0) {
                    return {
                        ...atracao,
                        imagemAlternativa: null,
                    };
                }

                limiteImagensAlternativas--;

                const imagem = await buscarImagemAlternativa(
                    `${atracao.name || "ponto turístico"} ${cidade.name}`
                );

                return {
                    ...atracao,
                    imagemAlternativa: imagem,
                };
            })
        );

        // 7. Retorna os resultados
        return NextResponse.json({
            destino: {
                nome: cidade.name,
                pais: cidade.country,
                latitude: cidade.lat,
                longitude: cidade.lon,
            },
            categoria: categoria || null,
            total: atracoesComImagens.length,
            atracoes: atracoesComImagens,
        });

    } catch (error) {
        console.error("Erro na busca de destinos:", error);

        return NextResponse.json(
            { erro: "Ocorreu um erro ao buscar destinos." },
            { status: 500 }
        );
    }
}
